"use client";

import { useEffect } from "react";
import { Box, CircularProgress } from "@mui/material";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLocale } from "@/components/providers/LocaleProvider";

export function AuthGuard({
  children,
  adminOnly = false,
}: {
  children: React.ReactNode;
  adminOnly?: boolean;
}) {
  const { user, ready } = useAuth();
  const { t } = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    } else if (adminOnly && user.role !== "admin") {
      router.replace("/catalog");
    }
  }, [adminOnly, pathname, ready, router, user]);

  const authorized = ready && Boolean(user) && (!adminOnly || user?.role === "admin");

  return (
    <>
      <Box
        aria-hidden={!authorized}
        sx={{ display: authorized ? "contents" : "none" }}
      >
        {children}
      </Box>
      {!authorized && (
        <Box className="guard-loading" role="status" aria-label={t("Checking access")}>
          <CircularProgress size={28} />
        </Box>
      )}
    </>
  );
}
