"use client";

import { useLocale } from "@/components/providers/LocaleProvider";

export function LocaleDate({
  value,
  dateStyle = "medium",
}: {
  value: string;
  dateStyle?: Intl.DateTimeFormatOptions["dateStyle"];
}) {
  const { locale } = useLocale();
  return new Intl.DateTimeFormat(locale, { dateStyle }).format(new Date(value));
}
