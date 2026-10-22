"use client";

import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import { IconButton, Tooltip } from "@mui/material";
import { useColorMode } from "@/theme/ThemeProvider";
import { useLocale } from "@/components/providers/LocaleProvider";

export function ColorModeToggle() {
  const { mode, toggleColorMode } = useColorMode();
  const { t } = useLocale();
  const nextMode = mode === "light" ? "dark" : "light";
  const label = t(`Switch to ${nextMode} mode`);

  return (
    <Tooltip title={label}>
      <IconButton
        aria-label={label}
        color="inherit"
        onClick={toggleColorMode}
      >
        {mode === "light" ? (
          <DarkModeOutlinedIcon />
        ) : (
          <LightModeOutlinedIcon />
        )}
      </IconButton>
    </Tooltip>
  );
}
