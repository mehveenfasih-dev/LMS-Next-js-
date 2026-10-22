export type UserRole = "admin" | "member";

export type LibraryUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  joinedAt: string;
};

export type Book = {
  id: string;
  isbn: string;
  title: string;
  author: string;
  category: string;
  year: number;
  publisher: string;
  pages: number;
  description: string;
  totalCopies: number;
  availableCopies: number;
};

export type BorrowRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "returned"
  | "overdue"
  | "cancelled";

export type BorrowRequest = {
  id: string;
  bookId: string;
  bookTitle: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: BorrowRequestStatus;
  requestedAt: string;
  dueAt: string | null;
};

export type BookInput = Omit<Book, "id" | "availableCopies">;
