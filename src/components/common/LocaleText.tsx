"use client";

import { useLocale } from "@/components/providers/LocaleProvider";

export function LocaleText({ message }: { message: string }) {
  const { t } = useLocale();
  return t(message);
}
