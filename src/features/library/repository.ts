import "server-only";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseId } from "@/features/users/repository";
import type {
  Book,
  BookInput,
  BorrowRequest,
  BorrowRequestStatus,
} from "./types";

const bookInclude = {
  bookAuthors: {
    include: { author: true },
    orderBy: { authorOrder: "asc" as const },
  },
  bookCategories: {
    include: { category: true },
    orderBy: { categoryID: "asc" as const },
  },
  bookCopies: { select: { copyStatus: true } },
};

export async function listBooks(): Promise<Book[]> {
  const books = await prisma.book.findMany({
    include: bookInclude,
    orderBy: [{ title: "asc" }, { bookID: "asc" }],
  });
  return books.map(toBook);
}

export async function getBook(id: string): Promise<Book | undefined> {
  const book = await prisma.book.findUnique({
    where: { bookID: parseId(id) },
    include: bookInclude,
  });
  return book ? toBook(book) : undefined;
}

export async function saveBook(input: BookInput, id?: string): Promise<Book> {
  return prisma.$transaction(async (transaction) => {
    const bookID = id ? parseId(id) : undefined;
    const existing = bookID
      ? await transaction.book.findUnique({
          where: { bookID },
          include: { bookCopies: true },
        })
      : undefined;
    if (bookID && !existing) {
      throw new Error("The book could not be found in the catalog.");
    }

    const copies = existing?.bookCopies ?? [];
    const nonAvailableCopies = copies.filter(
      (copy) => copy.copyStatus !== "AVAILABLE",
    ).length;
    if (input.totalCopies < nonAvailableCopies) {
      throw new Error(
        `At least ${nonAvailableCopies} copies are borrowed, lost, or damaged and cannot be removed.`,
      );
    }

    const book = existing
      ? await transaction.book.update({
          where: { bookID: existing.bookID },
          data: {
            title: input.title.trim(),
            ISBN: input.isbn.trim() || null,
            publishedYear: input.year,
            publisher: input.publisher.trim(),
            pages: input.pages,
            description: input.description.trim(),
          },
        })
      : await transaction.book.create({
          data: {
            title: input.title.trim(),
            ISBN: input.isbn.trim() || null,
            publishedYear: input.year,
            publisher: input.publisher.trim(),
            pages: input.pages,
            description: input.description.trim(),
          },
        });

    await saveCategories(transaction, book.bookID, input.category);
    await saveAuthors(transaction, book.bookID, input.author);

    const availableCopies = copies.filter(
      (copy) => copy.copyStatus === "AVAILABLE",
    );
    const targetAvailableCopies = input.totalCopies - nonAvailableCopies;
    if (targetAvailableCopies > availableCopies.length) {
      await transaction.bookCopy.createMany({
        data: Array.from(
          { length: targetAvailableCopies - availableCopies.length },
          () => ({
            bookID: book.bookID,
            barcode: `BH-${book.bookID}-${randomUUID()}`,
          }),
        ),
      });
    } else if (targetAvailableCopies < availableCopies.length) {
      await transaction.bookCopy.deleteMany({
        where: {
          copyID: {
            in: availableCopies
              .slice(targetAvailableCopies)
              .map((copy) => copy.copyID),
          },
        },
      });
    }

    const saved = await transaction.book.findUniqueOrThrow({
      where: { bookID: book.bookID },
      include: bookInclude,
    });
    return toBook(saved);
  });
}

export async function removeBook(id: string): Promise<void> {
  const bookID = parseId(id);
  await prisma.$transaction(async (transaction) => {
    const book = await transaction.book.findUnique({
      where: { bookID },
      include: {
        bookCopies: {
          include: { _count: { select: { borrowRequests: true } } },
        },
      },
    });
    if (!book) throw new Error("The book could not be found in the catalog.");
    if (book.bookCopies.some((copy) => copy._count.borrowRequests > 0)) {
      throw new Error(
        "This book has borrowing history and cannot be deleted. Keep the record to preserve the audit trail.",
      );
    }
    await transaction.bookCopy.deleteMany({ where: { bookID } });
    await transaction.book.delete({ where: { bookID } });
  });
}

export async function listBorrowRequests(
  userId?: string,
  take?: number,
): Promise<BorrowRequest[]> {
  const requests = await prisma.borrowRequest.findMany({
    where: userId ? { userID: parseId(userId) } : undefined,
    include: {
      user: { select: { userID: true, fullName: true, email: true } },
      copy: { include: { book: { select: { bookID: true, title: true } } } },
    },
    orderBy: [{ requestedAt: "desc" }, { requestID: "desc" }],
    take,
  });
  return requests.map(toBorrowRequest);
}

export async function createBorrowRequest(
  bookId: string,
  userId: string,
): Promise<BorrowRequest> {
  const bookID = parseId(bookId);
  const userID = parseId(userId);
  const requestID = await prisma.$transaction(
    async (transaction) => {
      const activeRequest = await transaction.borrowRequest.findFirst({
        where: {
          userID,
          status: { in: ["PENDING", "APPROVED"] },
          copy: { bookID },
        },
        select: { requestID: true },
      });
      if (activeRequest) {
        throw new Error("You already have an active request for this book.");
      }

      const copy = await transaction.bookCopy.findFirst({
        where: {
          bookID,
          copyStatus: "AVAILABLE",
          borrowRequests: { none: { status: "PENDING" } },
        },
        orderBy: { copyID: "asc" },
      });
      if (!copy) throw new Error("This book is currently unavailable.");

      const request = await transaction.borrowRequest.create({
        data: { copyID: copy.copyID, userID },
      });
      return request.requestID;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
  const created = await prisma.borrowRequest.findUniqueOrThrow({
    where: { requestID },
    include: {
      user: { select: { userID: true, fullName: true, email: true } },
      copy: { include: { book: { select: { bookID: true, title: true } } } },
    },
  });
  return toBorrowRequest(created);
}

export async function changeBorrowRequestStatus(
  id: string,
  status: Extract<BorrowRequestStatus, "approved" | "rejected" | "returned">,
): Promise<BorrowRequest> {
  if (!/^\d+$/.test(id)) throw new Error("The request ID is invalid.");
  const requestID = BigInt(id);
  if (requestID < BigInt(1)) throw new Error("The request ID is invalid.");
  await prisma.$transaction(
    async (transaction) => {
      const current = await transaction.borrowRequest.findUnique({
        where: { requestID },
        include: { copy: true },
      });
      if (!current) throw new Error("The borrowing request could not be found.");

      if (status === "approved" && current.status === "PENDING") {
        const updatedCopy = await transaction.bookCopy.updateMany({
          where: { copyID: current.copyID, copyStatus: "AVAILABLE" },
          data: { copyStatus: "ON_LOAN" },
        });
        if (updatedCopy.count !== 1) {
          throw new Error("No copies of this book are currently available.");
        }
        await transaction.borrowRequest.update({
          where: { requestID },
          data: {
            status: "APPROVED",
            approvedAt: new Date(),
            dueAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          },
        });
        return;
      }

      if (status === "rejected" && current.status === "PENDING") {
        await transaction.borrowRequest.update({
          where: { requestID },
          data: { status: "REJECTED" },
        });
        return;
      }

      if (status === "returned" && current.status === "APPROVED") {
        await transaction.borrowRequest.update({
          where: { requestID },
          data: { status: "RETURNED", returnedAt: new Date() },
        });
        await transaction.bookCopy.update({
          where: { copyID: current.copyID },
          data: { copyStatus: "AVAILABLE" },
        });
        return;
      }

      throw new Error("This borrowing request can no longer be updated.");
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );

  const updated = (await listBorrowRequests()).find(
    (request) => request.id === id,
  );
  if (!updated) throw new Error("The updated borrowing request could not be loaded.");
  return updated;
}

export async function getMonthlyBorrowingCounts(months = 6) {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  start.setMonth(start.getMonth() - (months - 1));

  const rows = await prisma.$queryRaw<
    Array<{ monthKey: string; requestCount: bigint }>
  >`SELECT CONVERT(char(7), [requestedAt], 126) AS [monthKey],
           COUNT_BIG(*) AS [requestCount]
    FROM [BorrowRequests]
    WHERE [requestedAt] >= ${start}
    GROUP BY YEAR([requestedAt]), MONTH([requestedAt])
    ORDER BY YEAR([requestedAt]), MONTH([requestedAt])`;
  return rows.map((row) => ({
    month: row.monthKey,
    count: Number(row.requestCount),
  }));
}

export async function getDashboardSummary() {
  const [bookTitles, availableCopies, activeMembers, pendingRequests] =
    await Promise.all([
      prisma.book.count(),
      prisma.bookCopy.count({ where: { copyStatus: "AVAILABLE" } }),
      prisma.user.count({
        where: { isActive: true, role: { roleName: "member" } },
      }),
      prisma.borrowRequest.count({ where: { status: "PENDING" } }),
    ]);
  return { bookTitles, availableCopies, activeMembers, pendingRequests };
}

export async function getCategoryBookCounts() {
  const categoryCounts = await prisma.bookCategory.groupBy({
    by: ["categoryID"],
    _count: { bookID: true },
    having: { bookID: { _count: { gt: 0 } } },
    orderBy: { _count: { bookID: "desc" } },
  });
  const categoryIds = categoryCounts.map((item) => item.categoryID);
  const categories = await prisma.category.findMany({
    where: { categoryID: { in: categoryIds } },
    select: { categoryID: true, categoryName: true },
  });
  const names = new Map(
    categories.map((category) => [category.categoryID, category.categoryName]),
  );
  return categoryCounts.map((item) => ({
    category: names.get(item.categoryID) ?? "Unknown",
    count: item._count.bookID,
  }));
}

async function saveCategories(
  transaction: Prisma.TransactionClient,
  bookID: number,
  categoryInput: string,
) {
  await transaction.bookCategory.deleteMany({ where: { bookID } });
  const names = [...new Set(categoryInput.split(",").map((name) => name.trim()).filter(Boolean))];
  for (const categoryName of names) {
    const category = await transaction.category.upsert({
      where: { categoryName },
      update: {},
      create: { categoryName },
    });
    await transaction.bookCategory.create({
      data: { bookID, categoryID: category.categoryID },
    });
  }
}

async function saveAuthors(
  transaction: Prisma.TransactionClient,
  bookID: number,
  authorInput: string,
) {
  await transaction.bookAuthor.deleteMany({ where: { bookID } });
  const names = [...new Set(authorInput.split(",").map((name) => name.trim()).filter(Boolean))];
  for (const [index, authorName] of names.entries()) {
    let author = await transaction.author.findFirst({ where: { authorName } });
    if (!author) {
      author = await transaction.author.create({ data: { authorName } });
    }
    await transaction.bookAuthor.create({
      data: { bookID, authorID: author.authorID, authorOrder: index + 1 },
    });
  }
}

function toBook(book: {
  bookID: number;
  ISBN: string | null;
  title: string;
  publishedYear: number | null;
  publisher: string;
  pages: number;
  description: string;
  bookAuthors: Array<{ author: { authorName: string } }>;
  bookCategories: Array<{ category: { categoryName: string } }>;
  bookCopies: Array<{ copyStatus: string }>;
}): Book {
  return {
    id: String(book.bookID),
    isbn: book.ISBN ?? "",
    title: book.title,
    author: book.bookAuthors.map(({ author }) => author.authorName).join(", "),
    category: book.bookCategories
      .map(({ category }) => category.categoryName)
      .join(", "),
    year: book.publishedYear ?? new Date().getFullYear(),
    publisher: book.publisher,
    pages: book.pages,
    description: book.description,
    totalCopies: book.bookCopies.length,
    availableCopies: book.bookCopies.filter(
      (copy) => copy.copyStatus === "AVAILABLE",
    ).length,
  };
}

function toBorrowRequest(request: {
  requestID: bigint;
  status: string;
  requestedAt: Date;
  dueAt: Date | null;
  user: { userID: number; fullName: string; email: string };
  copy: { book: { bookID: number; title: string } };
}): BorrowRequest {
  const status =
    request.status === "APPROVED" &&
    request.dueAt !== null &&
    request.dueAt.getTime() < Date.now()
      ? "overdue"
      : fromDatabaseStatus(request.status);
  return {
    id: String(request.requestID),
    bookId: String(request.copy.book.bookID),
    bookTitle: request.copy.book.title,
    userId: String(request.user.userID),
    userName: request.user.fullName,
    userEmail: request.user.email,
    status,
    requestedAt: request.requestedAt.toISOString(),
    dueAt: request.dueAt?.toISOString() ?? null,
  };
}

function fromDatabaseStatus(status: string): BorrowRequestStatus {
  switch (status) {
    case "PENDING":
      return "pending";
    case "APPROVED":
      return "approved";
    case "REJECTED":
      return "rejected";
    case "RETURNED":
      return "returned";
    case "CANCELLED":
      return "cancelled";
    default:
      throw new Error(`Unsupported borrowing request status "${status}".`);
  }
}
