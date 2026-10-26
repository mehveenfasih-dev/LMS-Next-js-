"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { Box, Button, Container, Typography } from "@mui/material";
import { useLocale } from "@/components/providers/LocaleProvider";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLocale();
  useEffect(() => {
    console.error("Library application error:", error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <Container maxWidth="sm">
      <Box className="error-page">
        <Typography component="h1" variant="h4">
          {t("Something went wrong")}
        </Typography>
        <Typography color="text.secondary">
          {t(
            "The page could not be loaded. Try again, or return to the catalog.",
          )}
        </Typography>
        <Box sx={{ display: "flex", gap: 1.5, mt: 1 }}>
          <Button onClick={reset} variant="contained">
            {t("Try again")}
          </Button>
          <Button href="/catalog" variant="outlined">
            {t("Go to catalog")}
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
