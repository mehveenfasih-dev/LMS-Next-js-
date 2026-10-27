import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import {
  Box,
  Button,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { LocaleText } from "@/components/common/LocaleText";
import { LocaleDate } from "@/components/common/LocaleDate";
import {
  getDashboardSummary,
  listBorrowRequests,
} from "@/features/library/repository";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <>
      <Box className="page-heading">
        <Typography component="h1" variant="h4">
          <LocaleText message="Dashboard" />
        </Typography>
        <Typography>
          <LocaleText message="Here's what's happening across your library today." />
        </Typography>
      </Box>

      {/* Streaming Section 1: Key Metrics */}
      <Suspense fallback={<StatsSkeleton />}>
        <DashboardStats />
      </Suspense>

      {/* Streaming Section 2: Recent Borrowing Activity */}
      <Box className="content-card">
        <Box className="content-card-heading">
          <Typography component="h2" variant="h6">
            <LocaleText message="Latest borrowing activity" />
          </Typography>
          <Typography color="text.secondary" variant="body2">
            <LocaleText message="Stay on top of requests from your members." />
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Button href="/requests" size="small" variant="outlined">
            <LocaleText message="View all requests" />
          </Button>
          <Button href="/books" size="small" variant="outlined">
            <LocaleText message="Manage books" />
          </Button>
        </Stack>

        <Suspense fallback={<ActivitySkeleton />}>
          <DashboardActivity />
        </Suspense>
      </Box>
    </>
  );
}

/**
 * Independent async server component streaming statistics
 */
async function DashboardStats() {
  await connection();
  const summary = await getDashboardSummary();
  const stats = [
    {
      label: "Titles in catalog",
      value: summary.bookTitles,
      hint: "Across the collection",
    },
    {
      label: "Copies available",
      value: summary.availableCopies,
      hint: "Ready to borrow",
    },
    {
      label: "Active members",
      value: summary.activeMembers,
      hint: "Member accounts",
    },
    {
      label: "Pending requests",
      value: summary.pendingRequests,
      hint: "Waiting for review",
    },
  ];

  return (
    <Box className="stat-grid">
      {stats.map((stat) => (
        <Box className="stat-card" key={stat.label}>
          <Typography className="stat-card-label">
            <LocaleText message={stat.label} />
          </Typography>
          <Typography className="stat-card-value">{stat.value}</Typography>
          <Typography className="stat-card-change">
            <LocaleText message={stat.hint} />
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

function StatsSkeleton() {
  return (
    <Box className="stat-grid">
      {Array.from({ length: 4 }).map((_, i) => (
        <Box className="stat-card" key={i}>
          <Skeleton width="50%" height={20} sx={{ mb: 1 }} />
          <Skeleton width="30%" height={40} sx={{ mb: 1 }} />
          <Skeleton width="70%" height={16} />
        </Box>
      ))}
    </Box>
  );
}

/**
 * Independent async server component streaming borrowing activity
 */
async function DashboardActivity() {
  await connection();
  const recentRequests = await listBorrowRequests(undefined, 5);

  return (
    <Box sx={{ overflowX: "auto" }}>
      <Table aria-label="Latest borrowing activity">
        <TableHead>
          <TableRow>
            <TableCell>
              <LocaleText message="Member" />
            </TableCell>
            <TableCell>
              <LocaleText message="Book" />
            </TableCell>
            <TableCell>
              <LocaleText message="Requested" />
            </TableCell>
            <TableCell>
              <LocaleText message="Status" />
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {recentRequests.map((request) => (
            <TableRow hover key={request.id}>
              <TableCell sx={{ fontWeight: 600 }}>{request.userName}</TableCell>
              <TableCell>{request.bookTitle}</TableCell>
              <TableCell>
                <LocaleDate value={request.requestedAt} />
              </TableCell>
              <TableCell>
                <Typography
                  component="span"
                  sx={{
                    color:
                      request.status === "pending"
                        ? "warning.main"
                        : "primary.main",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  <LocaleText message={request.status} />
                </Typography>
              </TableCell>
            </TableRow>
          ))}
          {recentRequests.length === 0 && (
            <TableRow>
              <TableCell colSpan={4}>
                <LocaleText message="No borrowing activity yet." />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Box>
  );
}

function ActivitySkeleton() {
  return (
    <Box sx={{ p: 2 }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} height={48} sx={{ my: 0.5 }} />
      ))}
    </Box>
  );
}
