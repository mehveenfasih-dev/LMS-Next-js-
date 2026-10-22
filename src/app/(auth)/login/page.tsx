import type { Metadata } from "next";
import { Box, CircularProgress } from "@mui/material";
import { Suspense } from "react";
import { AuthForm } from "@/features/auth/AuthForm";
import { googleAuthEnabled } from "@/auth-config";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  return (
    <Suspense
      fallback={
        <Box className="guard-loading" role="status" aria-label="Loading sign in">
          <CircularProgress size={28} />
        </Box>
      }
    >
      <LoginFormPage
        googleEnabled={googleAuthEnabled}
        searchParams={searchParams}
      />
    </Suspense>
  );
}

async function LoginFormPage({
  searchParams,
  googleEnabled,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
  googleEnabled: boolean;
}) {
  const params = await searchParams;
  const nextPath = Array.isArray(params.next) ? params.next[0] : params.next;
  return (
    <AuthForm
      googleEnabled={googleEnabled}
      mode="login"
      nextPath={nextPath}
    />
  );
}
