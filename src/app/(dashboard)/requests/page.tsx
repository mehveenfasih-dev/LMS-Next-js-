import type { Metadata } from "next";
import { connection } from "next/server";
import { Box, Typography } from "@mui/material";
import { RequestsTable } from "@/features/library/components/RequestsTable";
import { listBorrowRequests } from "@/features/library/repository";
import { LocaleText } from "@/components/common/LocaleText";

export const metadata: Metadata = { title: "Borrowing requests" };

export default async function RequestsPage() {
  await connection();
  const requests = await listBorrowRequests();
  return (
    <>
      <Box className="page-heading">
        <Typography component="h1" variant="h4"><LocaleText message="Borrowing requests" /></Typography>
        <Typography><LocaleText message="Review member requests and manage book returns." /></Typography>
      </Box>
      <RequestsTable adminView initialRequests={requests} />
    </>
  );
}
