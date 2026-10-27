"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import type { Book } from "@/features/library/types";
import { LocaleText } from "@/components/common/LocaleText";

type BookModalProps = {
  book: Book;
};

export function BookModal({ book }: BookModalProps) {
  const router = useRouter();

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  const handleNavigateFull = useCallback(() => {
    router.push(`/catalog/${book.id}`);
  }, [router, book.id]);

  return (
    <Dialog
      open
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="book-modal-title"
    >
      <DialogTitle
        id="book-modal-title"
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pr: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <AutoStoriesIcon color="primary" />
          <Typography variant="h6" component="span" sx={{ fontWeight: 700 }}>
            <LocaleText message="Book details" />
          </Typography>
        </Box>
        <IconButton
          aria-label="Close modal"
          onClick={handleClose}
          size="small"
          edge="end"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ py: 3 }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 700, mb: 1 }}>
          {book.title}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
          {book.author}
        </Typography>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2.5 }}>
          {book.category && (
            <Chip
              label={book.category}
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
          {book.year && (
            <Chip
              label={`Published: ${book.year}`}
              size="small"
              variant="outlined"
            />
          )}
          {book.pages && (
            <Chip
              label={`${book.pages} pages`}
              size="small"
              variant="outlined"
            />
          )}
          <Chip
            label={
              book.availableCopies > 0
                ? `${book.availableCopies} available`
                : "Checked out"
            }
            size="small"
            color={book.availableCopies > 0 ? "success" : "default"}
          />
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
          {book.description || (
            <em>No summary available for this title in the library catalog.</em>
          )}
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, justifyContent: "space-between" }}>
        <Button onClick={handleClose} color="inherit">
          <LocaleText message="Back to catalog" />
        </Button>
        <Button variant="contained" onClick={handleNavigateFull}>
          <LocaleText message="View details for" />
        </Button>
      </DialogActions>
    </Dialog>
  );
}
