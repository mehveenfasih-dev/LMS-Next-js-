import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { AppProviders } from "@/components/providers/AppProviders";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-book-hub",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "Book Hub",
    template: "%s | Book Hub",
  },
  description:
    "Discover books, manage borrowing requests, and care for your library collection.",
  openGraph: {
    type: "website",
    siteName: "Book Hub",
    title: "Book Hub",
    description:
      "Discover books, manage borrowing requests, and care for your library collection.",
  },
  twitter: {
    card: "summary",
    title: "Book Hub",
    description: "Discover books and manage borrowing requests.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.variable}>
        <AppRouterCacheProvider>
          <AppProviders>{children}</AppProviders>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
