import type { Metadata } from "next";
import { Suspense } from "react";
import { Box, CircularProgress, Container } from "@mui/material";
import { connection } from "next/server";
import { BookCatalog } from "@/features/library/components/BookCatalog";
import { getServerBooks } from "@/features/library/server-data";

export const metadata: Metadata = {
  title: "Book catalog",
  description: "Discover and request books from the Book Hub collection.",
};

export default function CatalogPage() {
  return (
    <Suspense
      fallback={
        <Container className="catalog-container" maxWidth="xl">
          <Box className="guard-loading" role="status" aria-label="Loading catalog">
            <CircularProgress size={28} />
          </Box>
        </Container>
      }
    >
      <CatalogContent />
    </Suspense>
  );
}

async function CatalogContent() {
  await connection();
  const books = await getServerBooks();
  return <BookCatalog books={books} />;
}
