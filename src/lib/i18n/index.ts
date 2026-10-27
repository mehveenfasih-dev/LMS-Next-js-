import "server-only";
import { cookies, headers } from "next/headers";
import {
  defaultLocale,
  dictionaries,
  supportedLocales,
  type AppLocale,
} from "./dictionaries";

export { defaultLocale, supportedLocales, type AppLocale };

export const LOCALE_COOKIE_NAME = "library.locale";

/**
 * Detects the user's preferred locale from request cookies or Accept-Language header.
 */
export async function getServerLocale(): Promise<AppLocale> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE_NAME)?.value as AppLocale;

  if (cookieLocale && supportedLocales.includes(cookieLocale)) {
    return cookieLocale;
  }

  const reqHeaders = await headers();
  const acceptLanguage = reqHeaders.get("accept-language");
  if (acceptLanguage) {
    if (acceptLanguage.toLowerCase().startsWith("fr")) {
      return "fr";
    }
  }

  return defaultLocale;
}

/**
 * Retrieves the translation dictionary for the given or detected locale.
 */
export async function getTranslations(locale?: AppLocale) {
  const activeLocale = locale ?? (await getServerLocale());
  const dict = dictionaries[activeLocale] ?? dictionaries[defaultLocale];

  return {
    locale: activeLocale,
    t: (key: string, fallback?: string): string => {
      return dict[key] ?? fallback ?? key;
    },
    formatDate: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => {
      const d = typeof date === "object" ? date : new Date(date);
      return new Intl.DateTimeFormat(activeLocale, options).format(d);
    },
    formatNumber: (value: number, options?: Intl.NumberFormatOptions) => {
      return new Intl.NumberFormat(activeLocale, options).format(value);
    },
  };
}
