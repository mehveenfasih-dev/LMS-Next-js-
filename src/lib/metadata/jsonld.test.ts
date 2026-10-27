import { describe, expect, it } from "vitest";
import {
  generateBookJsonLd,
  generateLibraryJsonLd,
  generateBreadcrumbJsonLd,
} from "./jsonld";
import type { Book } from "@/features/library/types";

describe("JSON-LD Metadata Generators", () => {
  const sampleBook: Book = {
    id: "book-1",
    title: "Clean Architecture",
    author: "Robert C. Martin",
    category: "Software",
    isbn: "978-0134494166",
    pages: 432,
    year: 2017,
    publisher: "Prentice Hall",
    description: "A craftsman guide to software structure and design.",
    totalCopies: 5,
    availableCopies: 3,
  };

  it("generates Schema.org Book structured data correctly", () => {
    const jsonLd = generateBookJsonLd(sampleBook, "https://bookhub.example.com");

    expect(jsonLd["@context"]).toBe("https://schema.org");
    expect(jsonLd["@type"]).toBe("Book");
    expect(jsonLd.name).toBe("Clean Architecture");
    expect(jsonLd.author.name).toBe("Robert C. Martin");
    expect(jsonLd.isbn).toBe("978-0134494166");
    expect(jsonLd.numberOfPages).toBe(432);
    expect(jsonLd.offers.availability).toBe("https://schema.org/InStock");
  });

  it("marks out-of-stock when available copies is 0", () => {
    const outOfStockBook = { ...sampleBook, availableCopies: 0 };
    const jsonLd = generateBookJsonLd(outOfStockBook, "https://bookhub.example.com");

    expect(jsonLd.offers.availability).toBe("https://schema.org/OutOfStock");
  });

  it("generates WebSite structured data with search action", () => {
    const siteJsonLd = generateLibraryJsonLd("https://bookhub.example.com");

    expect(siteJsonLd["@type"]).toBe("WebSite");
    expect(siteJsonLd.name).toBe("Book Hub");
    expect(siteJsonLd.potentialAction?.["@type"]).toBe("SearchAction");
  });

  it("generates BreadcrumbList structured data with proper sequence positions", () => {
    const breadcrumbs = generateBreadcrumbJsonLd([
      { name: "Home", url: "https://bookhub.example.com" },
      { name: "Catalog", url: "https://bookhub.example.com/catalog" },
      { name: "Clean Architecture", url: "https://bookhub.example.com/catalog/book-1" },
    ]);

    expect(breadcrumbs["@type"]).toBe("BreadcrumbList");
    expect(breadcrumbs.itemListElement).toHaveLength(3);
    expect(breadcrumbs.itemListElement[0].position).toBe(1);
    expect(breadcrumbs.itemListElement[2].name).toBe("Clean Architecture");
  });
});
