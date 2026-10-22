"use client";

import { Breadcrumbs, Link as MuiLink, Typography } from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/components/providers/LocaleProvider";

const labels: Record<string, string> = {
  catalog: "Catalog",
  books: "Books",
  dashboard: "Dashboard",
  requests: "Requests",
  users: "Members",
  "my-requests": "My requests",
  settings: "Settings",
  reports: "Reports",
  profile: "My profile",
};

export function AppBreadcrumbs() {
  const pathname = usePathname();
  const { t } = useLocale();
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return null;

  return (
    <Breadcrumbs aria-label={t("Breadcrumb")} sx={{ mb: 2.5 }}>
      <MuiLink component={Link} href="/catalog" underline="hover" color="inherit">
        {t("Home")}
      </MuiLink>
      {parts.map((part, index) => {
        const href = `/${parts.slice(0, index + 1).join("/")}`;
        const label =
          labels[part] ??
          (parts[index - 1] === "catalog" ? t("Book details") : part);
        return index === parts.length - 1 ? (
          <Typography color="text.primary" key={href} variant="body2">
            {t(label)}
          </Typography>
        ) : (
          <MuiLink
            component={Link}
            href={href}
            key={href}
            underline="hover"
            color="inherit"
          >
            {t(label)}
          </MuiLink>
        );
      })}
    </Breadcrumbs>
  );
}
