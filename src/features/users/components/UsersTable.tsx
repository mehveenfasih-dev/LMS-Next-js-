"use client";

import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  Chip,
  IconButton,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import type { User } from "../types";
import { notify } from "@/features/library/services";
import { useAuth } from "@/components/providers/AuthProvider";
import { useMembersQuery, useSetMemberActiveMutation } from "@/features/library/hooks";
import { useLocale } from "@/components/providers/LocaleProvider";

export function UsersTable({ users }: { users: User[] }) {
  const { user: currentUser } = useAuth();
  const { locale, t } = useLocale();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const membersQuery = useMembersQuery(users);
  const userRows = membersQuery.data ?? users;
  const setActiveMutation = useSetMemberActiveMutation();

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return userRows;

    return userRows.filter((user) =>
      [user.name, user.email, user.role, user.active ? "active" : "inactive"]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [query, userRows]);

  const visibleUsers = filteredUsers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  async function toggleUser(id: string, active: boolean) {
    try {
      await setActiveMutation.mutateAsync({ id, active });
      notify(active ? t("Member account activated.") : t("Member account deactivated."));
    } catch (error) {
      notify(
        error instanceof Error ? error.message : t("Could not update this member."),
        "error",
      );
    }
  }

  return (
    <Box className="content-card">
      <Box className="table-toolbar">
        <Box>
          <Typography component="h2" variant="h6">
            {t("Library members")}
          </Typography>
          <Typography color="text.secondary" variant="body2">
            {t("Search members and manage account access.")}
          </Typography>
        </Box>
        <TextField
          aria-label={t("Search members")}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(0);
          }}
          placeholder={t("Search members")}
          size="small"
          sx={{ width: { xs: "100%", sm: 280 } }}
          value={query}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      {membersQuery.isError && (
        <Typography color="error" sx={{ mb: 2 }}>
          {membersQuery.error.message}
        </Typography>
      )}
      <Box sx={{ overflowX: "auto" }}>
        <Table aria-label={t("Library members")}>
          <TableHead>
            <TableRow>
              <TableCell>{t("Name")}</TableCell>
              <TableCell>{t("Email")}</TableCell>
              <TableCell>{t("Role")}</TableCell>
              <TableCell>{t("Status")}</TableCell>
              <TableCell>{t("Joined")}</TableCell>
              <TableCell align="right">{t("Access")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleUsers.map((user) => (
              <TableRow hover key={user.id}>
                <TableCell sx={{ fontWeight: 600 }}>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell sx={{ textTransform: "capitalize" }}>{t(user.role)}</TableCell>
                <TableCell>
                  <Chip
                    color={user.active ? "success" : "default"}
                    label={t(user.active ? "Active" : "Inactive")}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  {new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
                    new Date(user.joinedAt),
                  )}
                </TableCell>
                <TableCell align="right">
                  {currentUser?.id !== user.id && (
                    <IconButton
                      aria-label={`${t(user.active ? "Deactivate" : "Activate")} ${user.name}`}
                      disabled={setActiveMutation.isPending}
                      onClick={() => toggleUser(user.id, !user.active)}
                      size="small"
                    >
                      <Typography color={user.active ? "error.main" : "success.main"} variant="caption">
                        {t(user.active ? "Disable" : "Enable")}
                      </Typography>
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {visibleUsers.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} sx={{ py: 5, textAlign: "center" }}>
                  {t("No members match")} &quot;{query}&quot;.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>
      <TablePagination
        component="div"
        count={filteredUsers.length}
        labelDisplayedRows={({ from, to, count }) =>
          `${from}–${to} ${t("of")} ${count}`
        }
        labelRowsPerPage={t("Rows per page")}
        onPageChange={(_, nextPage) => setPage(nextPage)}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(Number(event.target.value));
          setPage(0);
        }}
        page={page}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[5, 10, 25]}
      />
    </Box>
  );
}
