"use client";

import { useEffect, useState } from "react";
import { Box, LinearProgress } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { makeStore } from "@/store/store";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  hideLoader,
  selectIsLoading,
  showLoader,
} from "@/store/slices/appSlice";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { LocaleProvider } from "./LocaleProvider";
import { NotificationProvider } from "./NotificationProvider";

export function StateProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  const [store] = useState(makeStore);
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
    <Provider store={store}>
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
    </Provider>
  );
}

function GlobalLoading({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const loading = useAppSelector(selectIsLoading);

  useEffect(() => {
    const handleLoading = (event: WindowEventMap["library:loading"]) => {
      dispatch(event.detail === 1 ? showLoader() : hideLoader());
    };

    window.addEventListener("library:loading", handleLoading);
    return () => {
      window.removeEventListener("library:loading", handleLoading);
    };
  }, [dispatch]);

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
