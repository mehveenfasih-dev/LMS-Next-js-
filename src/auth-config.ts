import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import {
  findOrCreateGoogleUser,
  verifyUserCredentials,
} from "@/features/users/repository";

const googleClientId =
  process.env.AUTH_GOOGLE_ID ?? process.env.GOOGLE_CLIENT_ID;
const googleClientSecret =
  process.env.AUTH_GOOGLE_SECRET ?? process.env.GOOGLE_CLIENT_SECRET;
export const googleAuthEnabled = Boolean(googleClientId && googleClientSecret);

export const authConfig = {
  secret:
    process.env.AUTH_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    process.env.SESSION_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email =
          typeof credentials.email === "string"
            ? credentials.email.trim().toLowerCase()
            : "";
        const password =
          typeof credentials.password === "string" ? credentials.password : "";
        if (!email || !password) return null;
        const user = await verifyUserCredentials(email, password);
        if (!user) return null;
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          active: user.active,
          joinedAt: user.joinedAt,
        };
      },
    }),
    ...(googleClientId && googleClientSecret
      ? [
          Google({
            clientId: googleClientId,
            clientSecret: googleClientSecret,
            authorization: {
              params: {
                access_type: "offline",
                prompt: "consent",
                response_type: "code",
              },
            },
            async profile(profile) {
              if (
                profile.email_verified !== true ||
                typeof profile.email !== "string" ||
                !profile.email.trim()
              ) {
                throw new Error("Google sign in requires a verified email address.");
              }
              const user = await findOrCreateGoogleUser({
                email: profile.email,
                name:
                  typeof profile.name === "string" && profile.name.trim()
                    ? profile.name
                    : profile.email.split("@")[0],
              });
              return { ...user, image: profile.picture };
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        const googleUser =
          account?.provider === "google" && typeof user.email === "string"
            ? await findOrCreateGoogleUser({
                email: user.email,
                name:
                  typeof user.name === "string" && user.name.trim()
                    ? user.name
                    : user.email.split("@")[0],
              })
            : undefined;
        token.sub = googleUser?.id ?? user.id;
        token.role = googleUser?.role ?? user.role;
        token.active = googleUser?.active ?? user.active;
        token.joinedAt = googleUser?.joinedAt ?? user.joinedAt;
      }

      if (!isDatabaseUserId(token.sub) && typeof token.email === "string") {
        const googleUser = await findOrCreateGoogleUser({
          email: token.email,
          name:
            typeof token.name === "string" && token.name.trim()
              ? token.name
              : token.email.split("@")[0],
        });
        token.sub = googleUser.id;
        token.role = googleUser.role;
        token.active = googleUser.active;
        token.joinedAt = googleUser.joinedAt;
      }
      if (account?.provider === "google") {
        if (
          typeof account.access_token !== "string" ||
          typeof account.refresh_token !== "string" ||
          typeof account.expires_at !== "number"
        ) {
          throw new Error(
            "Google did not return access and refresh tokens. Check the offline access configuration.",
          );
        }

        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.accessTokenExpires = account.expires_at * 1000;
        token.error = undefined;
      }

      if (
        !token.accessTokenExpires ||
        Date.now() < token.accessTokenExpires - 60_000
      ) {
        return token;
      }

      try {
        return await refreshGoogleAccessToken(token);
      } catch (error) {
        console.error("Could not refresh the Google access token.", error);
        return {
          ...token,
          accessToken: undefined,
          error: "RefreshAccessTokenError",
        };
      }
    },
    async session({ session, token }) {
      if (session.user) {
        if (token.role !== "admin" && token.role !== "member") {
          throw new Error("The authenticated session has an invalid role.");
        }
        if (
          typeof token.active !== "boolean" ||
          typeof token.joinedAt !== "string"
        ) {
          throw new Error("The authenticated session is missing user details.");
        }
        session.user.id = token.sub ?? "";
        session.user.role = token.role;
        session.user.active = token.active;
        session.user.joinedAt = token.joinedAt;
      }
      session.accessToken = token.accessToken;
      session.oauthError = token.error;
      return session;
    },
  },
} satisfies NextAuthConfig;

function isDatabaseUserId(value: string | undefined): boolean {
if (!value || !/^[1-9]\d*$/.test(value)) return false;
const parsed = Number(value);
return Number.isSafeInteger(parsed) && parsed <= 2_147_483_647;
}

async function refreshGoogleAccessToken(
  token: import("next-auth/jwt").JWT,
): Promise<typeof token> {
  if (!token.refreshToken) {
    throw new Error("The Google session does not contain a refresh token.");
  }
  if (!googleClientId || !googleClientSecret) {
    throw new Error("Google OAuth credentials are not configured.");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: googleClientId,
      client_secret: googleClientSecret,
      grant_type: "refresh_token",
      refresh_token: token.refreshToken,
    }),
  });
  const payload: unknown = await response.json();
  if (!response.ok) {
    const errorDescription =
      typeof payload === "object" &&
      payload !== null &&
      "error_description" in payload &&
      typeof payload.error_description === "string"
        ? payload.error_description
        : `HTTP ${response.status}`;
    throw new Error(`Google token refresh failed: ${errorDescription}`);
  }
  if (typeof payload !== "object" || payload === null) {
    throw new Error("Google returned an invalid token refresh response.");
  }

  const refreshed = payload as Record<string, unknown>;
  if (
    typeof refreshed.access_token !== "string" ||
    typeof refreshed.expires_in !== "number"
  ) {
    throw new Error("Google returned incomplete token refresh details.");
  }

  return {
    ...token,
    accessToken: refreshed.access_token,
    accessTokenExpires: Date.now() + refreshed.expires_in * 1000,
    refreshToken:
      typeof refreshed.refresh_token === "string"
        ? refreshed.refresh_token
        : token.refreshToken,
    error: undefined,
  };
}
