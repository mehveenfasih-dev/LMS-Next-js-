"use client";

import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import AutoStoriesOutlinedIcon from "@mui/icons-material/AutoStoriesOutlined";
import { Avatar, Box, Button, Stack, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLocale } from "@/components/providers/LocaleProvider";

export function MemberProfile() {
  const { user, signOut } = useAuth();
  const { locale, t } = useLocale();
  const router = useRouter();

  function handleSignOut() {
    signOut();
    router.replace("/catalog");
  }

  if (!user) return null;
  return (
    <Box className="profile-layout">
      <Box className="profile-card">
        <Avatar className="profile-avatar">{user.name.slice(0, 1)}</Avatar>
        <Typography component="h1" variant="h5">{user.name}</Typography>
        <Typography color="text.secondary">{user.email}</Typography>
        <Typography className="profile-role">
          {user.role === "admin" ? t("Library administrator") : t("Library member")}
        </Typography>
      </Box>
      <Box className="content-card profile-details">
        <Typography component="h2" sx={{ mb: 2 }} variant="h6">
          {t("Account details")}
        </Typography>
        <Stack className="profile-detail-row" direction="row" spacing={1.5}>
          <AccountCircleOutlinedIcon color="primary" />
          <Box>
            <Typography color="text.secondary" variant="caption">{t("NAME")}</Typography>
            <Typography sx={{ fontWeight: 600 }}>{user.name}</Typography>
          </Box>
        </Stack>
        <Stack className="profile-detail-row" direction="row" spacing={1.5}>
          <AutoStoriesOutlinedIcon color="primary" />
          <Box>
            <Typography color="text.secondary" variant="caption">{t("MEMBER SINCE")}</Typography>
            <Typography sx={{ fontWeight: 600 }}>
              {new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(
                new Date(user.joinedAt),
              )}
            </Typography>
          </Box>
        </Stack>
        <Button color="error" onClick={handleSignOut} variant="outlined">
          {t("Sign out")}
        </Button>
      </Box>
    </Box>
  );
}
