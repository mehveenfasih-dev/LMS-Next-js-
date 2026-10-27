import type { Book } from "@/features/library/types";

/**
 * Structured Data (JSON-LD) generators for Search Engine Optimization (SEO).
 * Follows Schema.org standards recognized by Google and other crawlers.
 */

export function generateBookJsonLd(book: Book, siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Book",
    "@id": `${siteUrl}/catalog/${book.id}#book`,
    name: book.title,
    author: {
      "@type": "Person",
      name: book.author,
    },
    url: `${siteUrl}/catalog/${book.id}`,
    ...(book.isbn ? { isbn: book.isbn } : {}),
    ...(book.publisher
      ? {
          publisher: {
            "@type": "Organization",
            name: book.publisher,
          },
        }
      : {}),
    ...(book.year ? { datePublished: String(book.year) } : {}),
    ...(book.pages ? { numberOfPages: book.pages } : {}),
    ...(book.description ? { description: book.description } : {}),
    ...(book.category ? { genre: book.category } : {}),
    offers: {
      "@type": "Offer",
      availability:
        book.availableCopies > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      price: "0",
      priceCurrency: "USD",
      category: "LibraryLoan",
    },
  };
}

export function generateLibraryJsonLd(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    url: siteUrl,
    name: "Book Hub",
    description:
      "Discover books, manage borrowing requests, and care for your library collection.",
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/catalog?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function generateBreadcrumbJsonLd(
  items: Array<{ name: string; url: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
