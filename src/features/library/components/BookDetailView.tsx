"use client";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { notify } from "../services";
import { useBookQuery, useRequestBookMutation } from "../hooks";
import type { Book } from "../types";
import { BookCover } from "./BookCover";

export function BookDetailView({
  bookId,
  initialBook,
}: {
  bookId: string;
  initialBook?: Book;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLocale();
  const bookQuery = useBookQuery(bookId, initialBook);
  const requestMutation = useRequestBookMutation();
  const book = bookQuery.data ?? null;

  async function handleRequest() {
    if (!book) return;
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(`/catalog/${book.id}`)}`);
      return;
    }
    try {
      await requestMutation.mutateAsync({ book });
      notify(`${t("Your request has been sent")} “${book.title}”.`);
    } catch (error) {
      notify(
        error instanceof Error ? error.message : t("Could not request this book."),
        "error",
      );
    }
  }

  if (!book) {
    return (
      <Container className="detail-container" maxWidth="lg">
        {bookQuery.isError ? (
          <Alert severity="error">{bookQuery.error.message}</Alert>
        ) : (
          <Box className="guard-loading" role="status" aria-label={t("Loading book")}>
            <CircularProgress size={28} />
          </Box>
        )}
      </Container>
    );
  }

  return (
    <Container className="detail-container" maxWidth="lg">
      <Button
        component={Link}
        href="/catalog"
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 4 }}
      >
        {t("Back to catalog")}
      </Button>
      <Box className="book-detail">
        <Box className="detail-cover">
          <BookCover book={book} />
        </Box>
        <Box className="detail-copy">
          <Chip label={book.category} size="small" variant="outlined" />
          <Typography component="h1" variant="h3">
            {book.title}
          </Typography>
          <Typography className="detail-author" variant="h6">
            {t("by")} {book.author}
          </Typography>
          <Typography color="text.secondary" sx={{ lineHeight: 1.8 }}>
            {book.description}
          </Typography>
          <Box className="detail-facts">
            <Box>
              <Typography variant="caption">{t("PUBLISHED")}</Typography>
              <Typography sx={{ fontWeight: 700 }}>
                {book.year < 0 ? `${Math.abs(book.year)} ${t("BCE")}` : book.year}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption">{t("PUBLISHER")}</Typography>
              <Typography sx={{ fontWeight: 700 }}>{book.publisher}</Typography>
            </Box>
            <Box>
              <Typography variant="caption">{t("LENGTH")}</Typography>
              <Typography sx={{ fontWeight: 700 }}>{book.pages} {t("pages")}</Typography>
            </Box>
            <Box>
              <Typography variant="caption">{t("ISBN")}</Typography>
              <Typography sx={{ fontWeight: 700 }}>{book.isbn}</Typography>
            </Box>
          </Box>
          <Stack direction="row" spacing={2} sx={{ alignItems: "center", mt: 3 }}>
            <Button
              disabled={book.availableCopies === 0 || requestMutation.isPending}
              onClick={handleRequest}
              size="large"
              variant="contained"
            >
              {requestMutation.isPending ? t("Sending request…") : t("Request this book")}
            </Button>
            <Typography
              className={book.availableCopies > 0 ? "availability-in" : "availability-out"}
              variant="body2"
            >
              {book.availableCopies > 0
                ? `${book.availableCopies} ${t("of")} ${book.totalCopies} ${t("copies available")}`
                : t("All copies are checked out")}
            </Typography>
          </Stack>
          {!user && (
            <Alert severity="info" sx={{ mt: 3 }}>
              {t("Sign in as a member to request this title.")}
            </Alert>
          )}
          {bookQuery.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {bookQuery.error.message}
            </Alert>
          )}
        </Box>
      </Box>
    </Container>
  );
}
