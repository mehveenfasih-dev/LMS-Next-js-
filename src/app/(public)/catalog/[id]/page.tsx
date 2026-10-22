import type { Metadata } from "next";
import { Box, CircularProgress, Container } from "@mui/material";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { BookDetailView } from "@/features/library/components/BookDetailView";
import { getServerBook } from "@/features/library/server-data";

type BookPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: BookPageProps): Promise<Metadata> {
  await connection();
  const { id } = await params;
  const book = await getServerBook(id);
  if (!book) return { title: "Book not found" };
  return {
    title: book.title,
    description: book.description,
    openGraph: {
      type: "book",
      title: book.title,
      description: `${book.title} by ${book.author}`,
    },
  };
}

export default function BookPage({ params }: BookPageProps) {
  return (
    <Suspense
      fallback={
        <Container className="detail-container" maxWidth="lg">
          <Box className="guard-loading" role="status" aria-label="Loading book">
            <CircularProgress size={28} />
          </Box>
        </Container>
      }
    >
      <BookPageContent params={params} />
    </Suspense>
  );
}

async function BookPageContent({ params }: BookPageProps) {
  await connection();
  const { id } = await params;
  const book = await getServerBook(id);
  if (!book) notFound();
  return <BookDetailView bookId={id} initialBook={book} key={id} />;
}
