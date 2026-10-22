import type { Metadata } from "next";
import { connection } from "next/server";
import { Box, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { LocaleText } from "@/components/common/LocaleText";
import {
  getCategoryBookCounts,
  getMonthlyBorrowingCounts,
} from "@/features/library/repository";

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
        <Typography><LocaleText message="Collection and circulation at a glance." /></Typography>
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
        <Box
          aria-label="Monthly activity chart"
          role="img"
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            alignItems: "end",
            gap: 2,
            height: 280,
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          {latestMonths.map((item) => (
            <Box
              key={item.month}
              sx={{ display: "flex", height: "100%", flexDirection: "column", justifyContent: "end", alignItems: "center", gap: 1 }}
            >
              <Box
                sx={{
                  width: "min(56px, 75%)",
                  height: `${item.count === 0 ? 2 : Math.max(8, (item.count / maximumCount) * 90)}%`,
                  borderRadius: "8px 8px 0 0",
                  bgcolor: "primary.main",
                  opacity: 0.72,
                }}
              />
              <Typography color="text.secondary" sx={{ mb: 1.5 }} variant="caption">
                <LocaleText message={item.month} />
              </Typography>
              <Typography color="text.secondary" variant="caption">
                {item.count}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
      <Box className="content-card" sx={{ mt: 3 }}>
        <Typography component="h2" sx={{ mb: 2 }} variant="h6">
          <LocaleText message="Books by category" />
        </Typography>
        <Table aria-label="Books by category">
          <TableHead>
            <TableRow>
              <TableCell><LocaleText message="Category" /></TableCell>
              <TableCell align="right"><LocaleText message="Titles in catalog" /></TableCell>
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
