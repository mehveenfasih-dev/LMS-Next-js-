"use client";

import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  Button,
  Chip,
  Container,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useLocale } from "@/components/providers/LocaleProvider";
import { Alert, CircularProgress } from "@mui/material";
import { useBooksQuery } from "../hooks";
import type { Book } from "../types";
import { BookCover } from "./BookCover";

export function BookCatalog({ books }: { books: Book[] }) {
  const { t } = useLocale();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All categories");
  const booksQuery = useBooksQuery(books);
  const catalog = booksQuery.data ?? books;

  const categories = useMemo(
    () => ["All categories", ...new Set(catalog.map((book) => book.category))],
    [catalog],
  );
  const visibleBooks = useMemo(() => {
    const query = search.trim().toLowerCase();
    return catalog.filter((book) => {
      const matchesText =
        !query ||
        [book.title, book.author, book.category, book.isbn]
          .join(" ")
          .toLowerCase()
          .includes(query);
      return matchesText && (category === "All categories" || book.category === category);
    });
  }, [catalog, category, search]);

  return (
    <Container className="catalog-container" maxWidth="xl">
      <Box className="catalog-hero">
        <Typography className="eyebrow">{t("Your next chapter starts here")}</Typography>
        <Typography component="h1" variant="h2">
          {t("Find a book that")}
          <br />
          <span>{t("stays with you.")}</span>
        </Typography>
        <Typography className="catalog-intro">
          {t("Explore the collection, find something new, and request a copy from your local library.")}
        </Typography>
        <Typography className="catalog-count">
          {catalog.length} {t("books in the collection")}
        </Typography>
      </Box>

      <Stack className="catalog-toolbar" direction={{ xs: "column", sm: "row" }}>
        <TextField
          aria-label={t("Search books")}
          fullWidth
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t("Search by title, author, or ISBN")}
          size="small"
          value={search}
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
        <TextField
          aria-label={t("Filter by category")}
          select
          size="small"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          sx={{ minWidth: { xs: "100%", sm: 220 } }}
        >
          {categories.map((item) => (
            <MenuItem key={item} value={item}>
              {t(item)}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      {booksQuery.isError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {booksQuery.error.message}
        </Alert>
      )}
      <Box
        aria-live="polite"
        sx={{ minHeight: 36, mb: 2, display: "flex", alignItems: "flex-start" }}
      >
        {booksQuery.isFetching && (
          <CircularProgress aria-label={t("Refreshing catalog")} size={20} />
        )}
      </Box>

      {visibleBooks.length > 0 ? (
        <Box className="book-grid">
          {visibleBooks.map((book) => (
            <Box className="catalog-book" key={book.id}>
              <Link
                aria-label={`${t("View details for")} ${book.title}`}
                className="catalog-book-cover"
                href={`/catalog/${book.id}`}
              >
                <BookCover book={book} />
              </Link>
              <Stack spacing={0.75} sx={{ alignItems: "flex-start", pt: 1.75 }}>
                <Chip label={t(book.category)} size="small" variant="outlined" />
                <Typography
                  className="catalog-book-title"
                  component={Link}
                  href={`/catalog/${book.id}`}
                  variant="h6"
                >
                  {book.title}
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  {book.author}
                </Typography>
                <Typography
                  className={book.availableCopies > 0 ? "availability-in" : "availability-out"}
                  variant="caption"
                >
                  {book.availableCopies > 0
                    ? `${book.availableCopies} ${t("available")}`
                    : t("Currently unavailable")}
                </Typography>
              </Stack>
            </Box>
          ))}
        </Box>
      ) : (
        <Box className="empty-state">
          <Typography component="h2" variant="h6">
            {t("No books found")}
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            {t("Try a different title, author, or category.")}
          </Typography>
          <Button
            onClick={() => {
              setSearch("");
              setCategory("All categories");
            }}
          >
            {t("Clear filters")}
          </Button>
        </Box>
      )}
    </Container>
  );
}
