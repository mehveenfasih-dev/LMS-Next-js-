"use client";

import Image from "next/image";
import { Box, Typography } from "@mui/material";
import type { Book } from "../types";
import { useLocale } from "@/components/providers/LocaleProvider";

const colors = [
  ["#33584b", "#b4cdb4"],
  ["#55426f", "#d7c5e6"],
  ["#9d5b43", "#efc7ad"],
  ["#345a78", "#b9d5e8"],
  ["#866a35", "#eee0ae"],
];

export function BookCover({
  book,
  compact = false,
}: {
  book: Pick<Book, "id" | "title" | "author">;
  compact?: boolean;
}) {
  const { t } = useLocale();
  const colorIndex =
    book.id.split("").reduce((total, char) => total + char.charCodeAt(0), 0) %
    colors.length;
  const [background, accent] = colors[colorIndex];

  return (
    <Box
      className={`book-cover${compact ? " book-cover-compact" : ""}`}
      sx={{ "--cover-bg": background, "--cover-accent": accent }}
      aria-label={`${t("Cover of")} ${book.title}`}
      role="img"
    >
      <Image
        alt=""
        className="book-cover-art"
        fill
        sizes="(max-width: 768px) 50vw, 300px"
        src="/book-hub-book-pattern.svg"
      />
      <Box className="book-cover-frame">
        <Typography className="book-cover-title">{book.title}</Typography>
        <Typography className="book-cover-author">{book.author}</Typography>
      </Box>
    </Box>
  );
}
