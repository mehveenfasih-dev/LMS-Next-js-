import type { Metadata } from "next";
import { connection } from "next/server";
import { Box, Typography } from "@mui/material";
import { UsersTable } from "@/features/users/components/UsersTable";
import { listUsers } from "@/features/users/repository";
import { LocaleText } from "@/components/common/LocaleText";

export const metadata: Metadata = {
  title: "Members",
};

export default async function UsersPage() {
  await connection();
  const users = await listUsers();
  return (
    <>
      <Box className="page-heading">
        <Typography component="h1" variant="h4">
          <LocaleText message="Members" />
        </Typography>
        <Typography><LocaleText message="Manage member accounts and library access." /></Typography>
      </Box>
      <UsersTable users={users} />
    </>
  );
}
