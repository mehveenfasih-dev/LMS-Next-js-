"use client";

import { useEffect, useState } from "react";
import { Box, LinearProgress } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { useAppStore } from "@/store/app-store";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { LocaleProvider } from "./LocaleProvider";
import { NotificationProvider } from "./NotificationProvider";

export function StateProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <LocaleProvider>
        <ThemeProvider>
          <NotificationProvider>
            <AuthProvider>
              <GlobalLoading>{children}</GlobalLoading>
            </AuthProvider>
          </NotificationProvider>
        </ThemeProvider>
      </LocaleProvider>
    </QueryClientProvider>
  );
}

function GlobalLoading({ children }: { children: React.ReactNode }) {
  const loading = useAppStore((state) => state.pendingRequests > 0);
  const showLoader = useAppStore((state) => state.showLoader);
  const hideLoader = useAppStore((state) => state.hideLoader);

  useEffect(() => {
    const handleLoading = (event: WindowEventMap["library:loading"]) => {
      if (event.detail === 1) showLoader();
      else hideLoader();
    };

    window.addEventListener("library:loading", handleLoading);
    return () => {
      window.removeEventListener("library:loading", handleLoading);
    };
  }, [hideLoader, showLoader]);

  return (
    <Box sx={{ minHeight: "100vh" }}>
      <LinearProgress
        aria-label="Loading"
        sx={{
          position: "fixed",
          inset: "0 0 auto",
          zIndex: 1500,
          visibility: loading ? "visible" : "hidden",
        }}
      />
      {children}
    </Box>
  );
}
