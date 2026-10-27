import type { Metadata } from "next";
import { connection } from "next/server";
import dynamic from "next/dynamic";
import {
  Box,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { LocaleText } from "@/components/common/LocaleText";
import {
  getCategoryBookCounts,
  getMonthlyBorrowingCounts,
} from "@/features/library/repository";

const MonthlyActivityChart = dynamic(
  () =>
    import("@/features/library/components/MonthlyActivityChart").then(
      (mod) => mod.MonthlyActivityChart,
    ),
  {
    loading: () => (
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(6, 1fr)",
          alignItems: "end",
          gap: 2,
          height: 280,
          borderBottom: 1,
          borderColor: "divider",
          p: 2,
        }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <Box
            key={i}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1,
              height: "100%",
              justifyContent: "end",
            }}
          >
            <Skeleton
              variant="rectangular"
              width="60%"
              height={`${(i + 1) * 15}%`}
              sx={{ borderRadius: "8px 8px 0 0" }}
            />
            <Skeleton variant="text" width={40} />
          </Box>
        ))}
      </Box>
    ),
    ssr: true,
  },
);

export const metadata: Metadata = {
  title: "Reports",
};

export default async function ReportsPage() {
  await connection();
  const [monthlyCounts, categoryCounts] = await Promise.all([
    getMonthlyBorrowingCounts(),
    getCategoryBookCounts(),
  ]);
  const latestMonths = Array.from({ length: 6 }, (_, index) => {
    const month = new Date();
    month.setDate(1);
    month.setHours(0, 0, 0, 0);
    month.setMonth(month.getMonth() - (5 - index));
    const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`;
    const count =
      monthlyCounts.find((item) => item.month === monthKey)?.count ?? 0;
    return {
      month: new Intl.DateTimeFormat("en", { month: "short" }).format(month),
      count,
    };
  });
  const maximumCount = Math.max(...latestMonths.map((item) => item.count), 1);

  return (
    <>
      <Box className="page-heading">
        <Typography component="h1" variant="h4">
          <LocaleText message="Reports" />
        </Typography>
        <Typography>
          <LocaleText message="Collection and circulation at a glance." />
        </Typography>
      </Box>
      <Box className="content-card">
        <Box className="content-card-heading">
          <Typography component="h2" variant="h6">
            <LocaleText message="Monthly borrowing activity" />
          </Typography>
          <Typography color="text.secondary" variant="body2">
            <LocaleText message="Borrowing requests recorded in the database." />
          </Typography>
        </Box>
        <MonthlyActivityChart data={latestMonths} maximumCount={maximumCount} />
      </Box>
      <Box className="content-card" sx={{ mt: 3 }}>
        <Typography component="h2" sx={{ mb: 2 }} variant="h6">
          <LocaleText message="Books by category" />
        </Typography>
        <Table aria-label="Books by category">
          <TableHead>
            <TableRow>
              <TableCell>
                <LocaleText message="Category" />
              </TableCell>
              <TableCell align="right">
                <LocaleText message="Titles in catalog" />
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categoryCounts.map((item) => (
              <TableRow key={item.category}>
                <TableCell>{item.category}</TableCell>
                <TableCell align="right">{item.count}</TableCell>
              </TableRow>
            ))}
            {categoryCounts.length === 0 && (
              <TableRow>
                <TableCell colSpan={2}>
                  <LocaleText message="No category data is available." />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>
    </>
  );
}
