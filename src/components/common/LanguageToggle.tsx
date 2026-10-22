"use client";

import { Button } from "@mui/material";
import { useLocale } from "@/components/providers/LocaleProvider";

export function LanguageToggle() {
  const { locale, toggleLocale, t } = useLocale();
  const nextLocale = locale === "en" ? "fr" : "en";
  const label = locale === "en" ? t("Switch to French") : t("Switch to English");

  return (
    <Button
      aria-label={label}
      onClick={toggleLocale}
      size="small"
      title={label}
    >
      {nextLocale.toUpperCase()}
    </Button>
  );
}
