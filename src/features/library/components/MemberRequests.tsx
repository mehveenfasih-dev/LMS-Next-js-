"use client";

import { Box, Button, Typography } from "@mui/material";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import type { BorrowRequest } from "../types";
import { RequestsTable } from "./RequestsTable";

export function MemberRequests({
  initialRequests,
}: {
  initialRequests: BorrowRequest[];
}) {
  const { user } = useAuth();
  const { t } = useLocale();
  const ownRequests = initialRequests.filter(
    (request) => request.userId === user?.id,
  );

  return (
    <>
      <Box className="page-heading">
        <Typography component="h1" variant="h4">{t("My requests")}</Typography>
        <Typography>{t("Keep track of your current and past loans.")}</Typography>
      </Box>
      <RequestsTable initialRequests={initialRequests} memberId={user?.id} />
      {ownRequests.length === 0 && (
        <Box className="empty-state">
          <Typography sx={{ mb: 2 }} variant="body2">
            {t("Your reading list is empty for now. Find a book to get started.")}
          </Typography>
          <Button component={Link} href="/catalog" variant="contained">
            {t("Browse the catalog")}
          </Button>
        </Box>
      )}
    </>
  );
}
