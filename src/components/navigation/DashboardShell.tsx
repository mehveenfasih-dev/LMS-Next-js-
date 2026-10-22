"use client";

import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import AutoStoriesOutlinedIcon from "@mui/icons-material/AutoStoriesOutlined";
import MenuIcon from "@mui/icons-material/Menu";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import LibraryBooksOutlinedIcon from "@mui/icons-material/LibraryBooksOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import {
  AppBar,
  Avatar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { PropsWithChildren } from "react";
import { AuthGuard } from "@/components/common/AuthGuard";
import { AppBreadcrumbs } from "@/components/common/AppBreadcrumbs";
import { ColorModeToggle } from "@/components/common/ColorModeToggle";
import { LanguageToggle } from "@/components/common/LanguageToggle";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLocale } from "@/components/providers/LocaleProvider";

const drawerWidth = 250;

const navigationItems = [
  { label: "Overview", href: "/dashboard", icon: <DashboardOutlinedIcon /> },
  { label: "Books", href: "/books", icon: <LibraryBooksOutlinedIcon /> },
  { label: "Requests", href: "/requests", icon: <AssignmentOutlinedIcon /> },
  { label: "Members", href: "/users", icon: <PeopleAltOutlinedIcon /> },
  { label: "Reports", href: "/reports", icon: <BarChartOutlinedIcon /> },
  { label: "Settings", href: "/settings", icon: <SettingsOutlinedIcon /> },
];

export function DashboardShell({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { t } = useLocale();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"), { noSsr: true });
  const [mobileOpen, setMobileOpen] = useState(false);

  const drawerContent = (
    <Box>
      <Stack direction="row" spacing={1.2} sx={{ alignItems: "center", px: 2.5, py: 2.25 }}>
        <AutoStoriesOutlinedIcon color="primary" />
        <Box>
          <Typography
            color="primary.dark"
            sx={{ fontWeight: 800, letterSpacing: "-0.03em" }}
          >
            Book Hub
          </Typography>
          <Typography color="text.secondary" variant="caption">
            {t("Administration")}
          </Typography>
        </Box>
      </Stack>
      <Divider />
      <List sx={{ px: 1.25, py: 2 }}>
        {navigationItems.map((item) => {
          const selected = pathname === item.href;
          return (
            <ListItemButton
              key={item.href}
              component={Link}
              href={item.href}
              selected={selected}
              onClick={() => setMobileOpen(false)}
              sx={{
                mb: 0.5,
                borderRadius: 2,
                color: selected ? "primary.dark" : "text.secondary",
                "&.Mui-selected": {
                  backgroundColor: "secondary.main",
                },
                "&.Mui-selected:hover": {
                  backgroundColor: "secondary.main",
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 38,
                  color: selected ? "primary.main" : "inherit",
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={t(item.label === "Overview" ? "Dashboard" : item.label)}
                slotProps={{
                  primary: { sx: { fontSize: 14, fontWeight: 600 } },
                }}
              />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );

  return (
    <AuthGuard adminOnly>
      <Box className="dashboard-shell">
      <AppBar
        color="inherit"
        elevation={0}
        position="sticky"
        sx={{ borderBottom: 1, borderColor: "divider", zIndex: "appBar" }}
      >
        <Toolbar sx={{ minHeight: "68px !important", gap: 1.5 }}>
          {!isDesktop && (
            <IconButton
              aria-label={t("Open navigation menu")}
              edge="start"
              onClick={() => setMobileOpen(true)}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography
            color="text.primary"
            component="div"
            sx={{ flexGrow: 1, fontWeight: 700 }}
            variant="body1"
          >
            {t("Library administration")}
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ display: { xs: "none", sm: "block" } }}
            variant="body2"
          >
            {user?.name}
          </Typography>
          <ColorModeToggle />
          <LanguageToggle />
          <Avatar
            aria-label={user?.name ?? "Administrator"}
            sx={{ width: 34, height: 34, bgcolor: "primary.main", fontSize: 14 }}
          >
            {user?.name.slice(0, 1)}
          </Avatar>
          <IconButton aria-label={t("Sign out")} onClick={signOut} size="small">
            <Typography variant="caption">{t("Sign out")}</Typography>
          </IconButton>
        </Toolbar>
      </AppBar>
      <Box sx={{ display: "flex", minHeight: "calc(100vh - 68px)" }}>
        {isDesktop ? (
          <Drawer
            variant="permanent"
            sx={{
              width: drawerWidth,
              flexShrink: 0,
              "& .MuiDrawer-paper": {
                position: "relative",
                boxSizing: "border-box",
                width: drawerWidth,
                borderRight: 1,
                borderColor: "divider",
                backgroundImage: "none",
              },
            }}
          >
            {drawerContent}
          </Drawer>
        ) : (
          <Drawer
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            sx={{
              "& .MuiDrawer-paper": {
                boxSizing: "border-box",
                width: drawerWidth,
                backgroundImage: "none",
              },
            }}
          >
            {drawerContent}
          </Drawer>
        )}
        <Box component="main" className="dashboard-main" sx={{ flexGrow: 1 }}>
          <AppBreadcrumbs />
          {children}
        </Box>
      </Box>
      </Box>
    </AuthGuard>
  );
}
