"use client";

import AutoStoriesOutlinedIcon from "@mui/icons-material/AutoStoriesOutlined";
import MenuIcon from "@mui/icons-material/Menu";
import {
  AppBar,
  Box,
  Button,
  Container,
  Drawer,
  IconButton,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { MemberShell } from "./MemberShell";
import { ColorModeToggle } from "@/components/common/ColorModeToggle";
import { LanguageToggle } from "@/components/common/LanguageToggle";
import { useLocale } from "@/components/providers/LocaleProvider";

export function PublicShell({ children }: { children: React.ReactNode }) {
  const { user, ready, signOut } = useAuth();
  const { t } = useLocale();
  const [menuOpen, setMenuOpen] = useState(false);
  if (ready && user?.role === "member") {
    return <MemberShell>{children}</MemberShell>;
  }
  const links = [
    { label: t("Browse books"), href: "/catalog" },
    ...(user ? [{ label: t("My requests"), href: "/my-requests" }] : []),
    ...(user?.role === "admin"
      ? [{ label: t("Admin"), href: "/dashboard" }]
      : []),
  ];

  return (
    <Box className="public-shell">
      <AppBar className="public-appbar" color="inherit" position="sticky">
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ minHeight: "76px !important", gap: 3 }}>
            <Link href="/catalog" style={{ marginRight: "auto" }}>
              <Stack direction="row" spacing={1.2} sx={{ alignItems: "center" }}>
                <Box className="brand-mark">
                  <AutoStoriesOutlinedIcon />
                </Box>
                <Box>
                  <Typography className="brand-title">Book Hub</Typography>
                  <Typography className="brand-caption">{t("A place to discover")}</Typography>
                </Box>
              </Stack>
            </Link>
            <Stack
              direction="row"
              spacing={2.5}
              sx={{ alignItems: "center", display: { xs: "none", md: "flex" } }}
            >
              {links.map((link) => (
                <Button
                  component={Link}
                  href={link.href}
                  key={link.href}
                  color="inherit"
                  size="small"
                >
                  {link.label}
                </Button>
              ))}
              {user ? (
                <>
                  <LanguageToggle />
                  <ColorModeToggle />
                  <Typography color="text.secondary" variant="body2">
                    {user.name}
                  </Typography>
                  <Button onClick={signOut} size="small">
                    {t("Sign out")}
                  </Button>
                </>
              ) : (
                <>
                  <LanguageToggle />
                  <ColorModeToggle />
                  <Button component={Link} href="/login" variant="contained">
                    {t("Sign in")}
                  </Button>
                </>
              )}
            </Stack>
            <IconButton
              aria-label={t("Open navigation")}
              onClick={() => setMenuOpen(true)}
              sx={{ display: { md: "none" } }}
            >
              <MenuIcon />
            </IconButton>
          </Toolbar>
        </Container>
      </AppBar>
      <Drawer anchor="right" onClose={() => setMenuOpen(false)} open={menuOpen}>
        <Stack className="mobile-menu" spacing={1}>
          {links.map((link) => (
            <Button
              component={Link}
              href={link.href}
              key={link.href}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Button>
          ))}
          {user ? (
            <Button onClick={signOut}>{t("Sign out")}</Button>
          ) : (
            <Button component={Link} href="/login">
              {t("Sign in")}
            </Button>
          )}
          <LanguageToggle />
          <ColorModeToggle />
        </Stack>
      </Drawer>
      <Box component="main" className="public-main">
        {children}
      </Box>
      <Box component="footer" className="public-footer">
        <Container maxWidth="xl">
          <Typography variant="body2">
            {t("Book Hub · Read widely, return often.")}
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
