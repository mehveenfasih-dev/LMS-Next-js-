export type AppLocale = "en" | "fr";

export const defaultLocale: AppLocale = "en";
export const supportedLocales: readonly AppLocale[] = ["en", "fr"] as const;

export const dictionaries: Record<AppLocale, Record<string, string>> = {
  en: {
    "app.name": "Book Hub",
    "app.tagline": "Discover books, manage borrowing requests, and care for your library collection.",
    "catalog.title": "Book Catalog",
    "catalog.searchPlaceholder": "Search by title, author, or ISBN",
    "common.loading": "Loading...",
    "common.error": "Something went wrong",
  },
  fr: {
    "app.name": "Book Hub",
    "app.tagline": "Découvrez des livres, gérez vos demandes d’emprunt et prenez soin de votre collection.",
    "catalog.title": "Catalogue des livres",
    "catalog.searchPlaceholder": "Rechercher par titre, auteur ou ISBN",
    "common.loading": "Chargement...",
    "common.error": "Une erreur s’est produite",
  },
};
