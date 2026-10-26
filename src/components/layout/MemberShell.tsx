"use client";

import AutoStoriesOutlinedIcon from "@mui/icons-material/AutoStoriesOutlined";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import LibraryBooksOutlinedIcon from "@mui/icons-material/LibraryBooksOutlined";
import LogoutIcon from "@mui/icons-material/Logout";
import {
  Avatar,
  Box,
  Button,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthGuard } from "@/components/common/AuthGuard";
import { AppBreadcrumbs } from "@/components/common/AppBreadcrumbs";
import { ColorModeToggle } from "@/components/common/ColorModeToggle";
import { LanguageToggle } from "@/components/common/LanguageToggle";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLocale } from "@/components/providers/LocaleProvider";

const links = [
  { label: "Discover books", href: "/catalog", icon: <LibraryBooksOutlinedIcon /> },
  { label: "My requests", href: "/my-requests", icon: <DashboardOutlinedIcon /> },
  { label: "My profile", href: "/profile", icon: <AccountCircleOutlinedIcon /> },
];

export function MemberShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { t } = useLocale();

  return (
    <AuthGuard>
      <Box className="portal-shell">
        <Box component="aside" className="portal-sidebar">
          <Link className="portal-brand" href="/catalog">
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <AutoStoriesOutlinedIcon color="primary" />
              <Typography sx={{ fontWeight: 800 }}>Book Hub</Typography>
            </Stack>
          </Link>
          <Box className="portal-mode-toggle" >
            <ColorModeToggle />
            <LanguageToggle />
          </Box>
          <Typography className="sidebar-label">{t("MEMBER SPACE")}</Typography>
          <List sx={{ px: 1.5 }}>
            {links.map((link) => (
              <ListItemButton
                component={Link}
                href={link.href}
                key={link.href}
                selected={pathname === link.href}
                sx={{ borderRadius: 2, mb: 0.5 }}
              >
                <ListItemIcon>{link.icon}</ListItemIcon>
                <ListItemText primary={t(link.label)} />
              </ListItemButton>
            ))}
          </List>
          <Box sx={{ flexGrow: 1 }} />
          <Divider />
          <Stack direction="row" spacing={1.2} sx={{ alignItems: "center", p: 2 }}>
            <Avatar sx={{ bgcolor: "primary.main" }}>{user?.name[0]}</Avatar>
            <Box sx={{ minWidth: 0, flexGrow: 1 }}>
              <Typography noWrap sx={{ fontWeight: 700 }} variant="body2">
                {user?.name}
              </Typography>
              <Typography noWrap color="text.secondary" variant="caption">
                {t("Library member")}
              </Typography>
            </Box>
            <Button
              aria-label={t("Sign out")}
              onClick={signOut}
              size="small"
              title={t("Sign out")}
            >
              <LogoutIcon fontSize="small" />
            </Button>
          </Stack>
        </Box>
        <Box component="main" className="portal-content">
          <AppBreadcrumbs />
          {children}
        </Box>
      </Box>
    </AuthGuard>
  );
}
