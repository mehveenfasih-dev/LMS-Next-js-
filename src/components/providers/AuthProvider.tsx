"use client";

import {
  SessionProvider,
  getSession,
  signIn as authSignIn,
  signOut as authSignOut,
  useSession,
} from "next-auth/react";
import { createContext, useContext, useEffect, useMemo } from "react";
import type { LibraryUser } from "@/features/library/types";
import { useNotification } from "@/components/providers/NotificationProvider";

type AuthContextValue = {
  user: LibraryUser | null;
  ready: boolean;
  signIn: (email: string, password: string) => Promise<LibraryUser>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthSessionBridge>{children}</AuthSessionBridge>
    </SessionProvider>
  );
}

function AuthSessionBridge({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const { notify } = useNotification();
  const user = useMemo<LibraryUser | null>(
    () =>
      session?.user
        ? {
            id: session.user.id,
            name: session.user.name ?? "",
            email: session.user.email ?? "",
            role: session.user.role,
            active: session.user.active,
            joinedAt: session.user.joinedAt,
          }
        : null,
    [session],
  );

  useEffect(() => {
    if (session?.oauthError === "RefreshAccessTokenError") {
      notify(
        "Your Google access token could not be refreshed. Sign in with Google again to reconnect.",
        "error",
      );
    }
  }, [notify, session?.oauthError]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      ready: status !== "loading",
      async signIn(email, password) {
        const result = await authSignIn("credentials", {
          email,
          password,
          redirect: false,
        });
        if (!result || result.error) {
          throw new Error("Email or password is incorrect.");
        }
        const updatedSession = await getSession();
        if (!updatedSession?.user) {
          throw new Error("Sign in succeeded but no session was returned.");
        }
        return {
          id: updatedSession.user.id,
          name: updatedSession.user.name ?? "",
          email: updatedSession.user.email ?? "",
          role: updatedSession.user.role,
          active: updatedSession.user.active,
          joinedAt: updatedSession.user.joinedAt,
        };
      },
      async signOut() {
        await authSignOut({ redirect: false });
      },
    }),
    [status, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }
  return context;
}
