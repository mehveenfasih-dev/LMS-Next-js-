"use client";

import AddIcon from "@mui/icons-material/Add";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { notify } from "../services";
import {
  useBooksQuery,
  useDeleteBookMutation,
  useSaveBookMutation,
} from "../hooks";
import type { Book, BookInput } from "../types";
import { useLocale } from "@/components/providers/LocaleProvider";

const categories = [
  "Classics",
  "Fiction",
  "History",
  "Personal Growth",
  "Science",
  "Technology",
];
const emptyBook: BookInput = {
  isbn: "",
  title: "",
  author: "",
  category: "Technology",
  year: new Date().getFullYear(),
  publisher: "",
  pages: 1,
  description: "",
  totalCopies: 1,
};

export function BookManager({ initialBooks }: { initialBooks: Book[] }) {
  const { t } = useLocale();
  const booksQuery = useBooksQuery(initialBooks);
  const books = booksQuery.data ?? initialBooks;
  const saveBookMutation = useSaveBookMutation();
  const deleteBookMutation = useDeleteBookMutation();
  const [draft, setDraft] = useState<BookInput>(emptyBook);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  function startCreate() {
    setEditingId(undefined);
    setDraft(emptyBook);
    setDialogOpen(true);
  }

  function startEdit(book: Book) {
    setEditingId(book.id);
    setDraft({
      isbn: book.isbn,
      title: book.title,
      author: book.author,
      category: book.category,
      year: book.year,
      publisher: book.publisher,
      pages: book.pages,
      description: book.description,
      totalCopies: book.totalCopies,
    });
    setDialogOpen(true);
  }

  async function submitBook(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await saveBookMutation.mutateAsync({ input: draft, id: editingId });
      setDialogOpen(false);
      notify(t(editingId ? "Book details updated." : "Book added to the catalog."));
    } catch (error) {
      notify(error instanceof Error ? error.message : t("Could not save this book."), "error");
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    try {
      await deleteBookMutation.mutateAsync(deleteId);
      setDeleteId(null);
      notify(t("Book removed from the catalog."));
    } catch (error) {
      notify(error instanceof Error ? error.message : t("Could not remove this book."), "error");
    }
  }

  return (
    <>
      <Box className="content-card">
        <Stack
          className="table-toolbar"
          direction={{ xs: "column", sm: "row" }}
          sx={{ alignItems: { xs: "stretch", sm: "center" } }}
        >
          <Box>
            <Typography component="h2" variant="h6">{t("Book inventory")}</Typography>
            <Typography color="text.secondary" variant="body2">
              {books.length} {t("titles in the catalog")}
            </Typography>
          </Box>
          <Button onClick={startCreate} startIcon={<AddIcon />} variant="contained">
            {t("Add a book")}
          </Button>
        </Stack>
        {booksQuery.isError && (
          <Typography color="error" sx={{ mb: 2 }}>
            {booksQuery.error.message}
          </Typography>
        )}
        <Box sx={{ overflowX: "auto" }}>
          <Table aria-label={t("Book inventory")}>
            <TableHead>
              <TableRow>
                <TableCell>{t("Title")}</TableCell>
                <TableCell>{t("Author")}</TableCell>
                <TableCell>{t("Category")}</TableCell>
                <TableCell>{t("Availability")}</TableCell>
                <TableCell align="right">{t("Actions")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {books.map((book) => (
                <TableRow hover key={book.id}>
                  <TableCell sx={{ minWidth: 180, fontWeight: 600 }}>{book.title}</TableCell>
                  <TableCell>{book.author}</TableCell>
                  <TableCell>{book.category}</TableCell>
                  <TableCell>{book.availableCopies} / {book.totalCopies}</TableCell>
                  <TableCell align="right">
                    <IconButton aria-label={`${t("Edit")} ${book.title}`} onClick={() => startEdit(book)}>
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                    <IconButton aria-label={`${t("Delete")} ${book.title}`} onClick={() => setDeleteId(book.id)}>
                      <DeleteOutlinedIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Box>
      <Dialog fullWidth maxWidth="sm" onClose={() => setDialogOpen(false)} open={dialogOpen}>
        <Box component="form" onSubmit={submitBook}>
          <DialogTitle>{editingId ? t("Edit book") : t("Add a book")}</DialogTitle>
          <DialogContent>
            <Box className="book-form-grid">
              <TextField
                required
                label={t("Title")}
                value={draft.title}
                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
              />
              <TextField
                required
                label={t("Author")}
                value={draft.author}
                onChange={(event) => setDraft({ ...draft, author: event.target.value })}
              />
              <TextField
                required
                label={t("ISBN")}
                value={draft.isbn}
                onChange={(event) => setDraft({ ...draft, isbn: event.target.value })}
              />
              <TextField
                select
                label={t("Category")}
                value={draft.category}
                onChange={(event) => setDraft({ ...draft, category: event.target.value })}
              >
                {categories.map((category) => <MenuItem key={category} value={category}>{t(category)}</MenuItem>)}
              </TextField>
              <TextField
                required
                type="number"
                label={t("Publication year")}
                value={draft.year}
                onChange={(event) => setDraft({ ...draft, year: Number(event.target.value) })}
              />
              <TextField
                required
                type="number"
                label={t("Pages")}
                slotProps={{ htmlInput: { min: 1 } }}
                value={draft.pages}
                onChange={(event) => setDraft({ ...draft, pages: Number(event.target.value) })}
              />
              <TextField
                required
                type="number"
                label={t("Total copies")}
                slotProps={{ htmlInput: { min: 1 } }}
                value={draft.totalCopies}
                onChange={(event) => setDraft({ ...draft, totalCopies: Number(event.target.value) })}
              />
              <TextField
                required
                label={t("Publisher")}
                value={draft.publisher}
                onChange={(event) => setDraft({ ...draft, publisher: event.target.value })}
              />
              <TextField
                required
                className="book-form-description"
                label={t("Description")}
                multiline
                minRows={3}
                value={draft.description}
                onChange={(event) => setDraft({ ...draft, description: event.target.value })}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={() => setDialogOpen(false)}>{t("Cancel")}</Button>
            <Button disabled={saveBookMutation.isPending} type="submit" variant="contained">
              {saveBookMutation.isPending ? t("Saving…") : t("Save book")}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
      <Dialog onClose={() => setDeleteId(null)} open={deleteId !== null}>
        <DialogTitle>{t("Remove this book?")}</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            {t("The book will be removed from the catalog. This action cannot be undone.")}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>{t("Cancel")}</Button>
          <Button
            color="error"
            disabled={deleteBookMutation.isPending}
            onClick={confirmDelete}
            variant="contained"
          >
            {t("Remove book")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
