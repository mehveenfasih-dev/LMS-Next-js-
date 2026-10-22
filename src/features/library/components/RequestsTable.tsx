"use client";

import {
  Box,
  Button,
  Chip,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import { notify } from "../services";
import type { BorrowRequest, BorrowRequestStatus } from "../types";
import { useRequestsQuery, useUpdateRequestMutation } from "../hooks";
import { useLocale } from "@/components/providers/LocaleProvider";

const statusColors: Record<
  BorrowRequestStatus,
  "default" | "success" | "warning" | "error" | "info"
> = {
  pending: "warning",
  approved: "info",
  rejected: "error",
  returned: "success",
  overdue: "error",
  cancelled: "default",
};

function readableDate(value: string | null, locale: "en" | "fr") {
  return value
    ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(value))
    : "—";
}

export function RequestsTable({
  initialRequests,
  memberId,
  adminView = false,
}: {
  initialRequests: BorrowRequest[];
  memberId?: string;
  adminView?: boolean;
}) {
  const { locale, t } = useLocale();
  const requestsQuery = useRequestsQuery(initialRequests);
  const requests = requestsQuery.data ?? initialRequests;
  const updateMutation = useUpdateRequestMutation();
  const [filter, setFilter] = useState("all");
  const filtered = useMemo(
    () =>
      requests.filter(
        (request) =>
          (!memberId || request.userId === memberId) &&
          (filter === "all" || request.status === filter),
      ),
    [filter, memberId, requests],
  );

  async function update(request: BorrowRequest, status: BorrowRequestStatus) {
    try {
      await updateMutation.mutateAsync({ id: request.id, status });
      notify(`${t("Request")} ${t(status)}.`);
    } catch (error) {
      notify(
        error instanceof Error ? error.message : t("Could not update the request."),
        "error",
      );
    }
  }

  return (
    <Box className="content-card">
      <Stack
        className="table-toolbar"
        direction={{ xs: "column", sm: "row" }}
        sx={{ alignItems: { xs: "stretch", sm: "center" } }}
      >
        <Box>
          <Typography component="h2" variant="h6">
            {adminView ? t("Borrowing requests") : t("Your borrowing history")}
          </Typography>
          <Typography color="text.secondary" variant="body2">
            {adminView
              ? t("Review requests and keep the collection moving.")
              : t("Track the status and due dates of your books.")}
          </Typography>
        </Box>
        <TextField
          select
          label={t("Status")}
          size="small"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          sx={{ minWidth: 170 }}
        >
          <MenuItem value="all">{t("All statuses")}</MenuItem>
          {(["pending", "approved", "rejected", "returned", "overdue", "cancelled"] as const).map(
            (status) => (
              <MenuItem key={status} value={status}>{t(status)}</MenuItem>
            ),
          )}
        </TextField>
      </Stack>
      {requestsQuery.isError && (
        <Typography color="error" sx={{ mb: 2 }}>
          {requestsQuery.error.message}
        </Typography>
      )}
      {filtered.length > 0 ? (
        <Box sx={{ overflowX: "auto" }}>
          <Table aria-label={t("Borrowing requests")}>
            <TableHead>
              <TableRow>
                <TableCell>{t("Book")}</TableCell>
                {adminView && <TableCell>{t("Member")}</TableCell>}
                <TableCell>{t("Requested")}</TableCell>
                <TableCell>{t("Due date")}</TableCell>
                <TableCell>{t("Status")}</TableCell>
                {adminView && <TableCell align="right">{t("Action")}</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((request) => (
                <TableRow hover key={request.id}>
                  <TableCell sx={{ minWidth: 180, fontWeight: 600 }}>
                    {request.bookTitle}
                  </TableCell>
                  {adminView && (
                    <TableCell>
                      <Typography variant="body2">{request.userName}</Typography>
                      <Typography color="text.secondary" variant="caption">
                        {request.userEmail}
                      </Typography>
                    </TableCell>
                  )}
                  <TableCell>{readableDate(request.requestedAt, locale)}</TableCell>
                  <TableCell>{readableDate(request.dueAt, locale)}</TableCell>
                  <TableCell>
                    <Chip
                      color={statusColors[request.status]}
                      label={t(request.status)}
                      size="small"
                      sx={{ textTransform: "capitalize" }}
                    />
                  </TableCell>
                  {adminView && (
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
                        {request.status === "pending" && (
                          <>
                            <Button
                              disabled={updateMutation.isPending}
                              onClick={() => update(request, "approved")}
                              size="small"
                            >
                              {t("Approve")}
                            </Button>
                            <Button
                              color="error"
                              disabled={updateMutation.isPending}
                              onClick={() => update(request, "rejected")}
                              size="small"
                            >
                              {t("Decline")}
                            </Button>
                          </>
                        )}
                        {["approved", "overdue"].includes(request.status) && (
                          <Button
                            disabled={updateMutation.isPending}
                            onClick={() => update(request, "returned")}
                            size="small"
                          >
                            {t("Mark returned")}
                          </Button>
                        )}
                      </Stack>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      ) : (
        <Box className="empty-state">
          <Typography color="text.secondary">
            {memberId
              ? t("You do not have any requests with this status yet.")
              : t("There are no requests with this status.")}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
