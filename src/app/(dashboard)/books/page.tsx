import type { Metadata } from "next";
import { connection } from "next/server";
import { Box, Typography } from "@mui/material";
import { BookManager } from "@/features/library/components/BookManager";
import { getServerBooks } from "@/features/library/server-data";
import { LocaleText } from "@/components/common/LocaleText";

export const metadata: Metadata = { title: "Book inventory" };

export default async function BooksPage() {
  await connection();
  const books = await getServerBooks();
  return (
    <>
      <Box className="page-heading">
        <Typography component="h1" variant="h4"><LocaleText message="Book inventory" /></Typography>
        <Typography><LocaleText message="Add, edit, and track titles in the collection." /></Typography>
      </Box>
      <BookManager initialBooks={books} />
    </>
  );
}
