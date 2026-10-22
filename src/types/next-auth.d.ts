import type { DefaultSession } from "next-auth";
import type { UserRole } from "@/features/library/types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      active: boolean;
      joinedAt: string;
    } & DefaultSession["user"];
    accessToken?: string;
    oauthError?: "RefreshAccessTokenError";
  }

  interface User {
    role: UserRole;
    active: boolean;
    joinedAt: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole;
    active: boolean;
    joinedAt: string;
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    error?: "RefreshAccessTokenError";
  }
}
