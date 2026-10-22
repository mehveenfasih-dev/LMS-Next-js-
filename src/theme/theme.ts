"use client";

import { createTheme } from "@mui/material/styles";
import type { ColorMode } from "./ThemeProvider";

export function createAppTheme(mode: ColorMode) {
  const dark = mode === "dark";
  return createTheme({
    palette: {
      mode,
      primary: {
        main: dark ? "#9bc9a0" : "#347445",
        dark: dark ? "#6da678" : "#285b36",
        contrastText: dark ? "#142019" : "#ffffff",
      },
      secondary: {
        main: dark ? "#2d4436" : "#e7f0e8",
        contrastText: dark ? "#d7e8da" : "#285b36",
      },
      background: {
        default: dark ? "#151c18" : "#f6f8f5",
        paper: dark ? "#202a24" : "#ffffff",
      },
      text: {
        primary: dark ? "#e5ece6" : "#17251f",
        secondary: dark ? "#aab8ae" : "#66756d",
      },
      divider: dark ? "#39463e" : "#e5ebe6",
    },
    shape: {
      borderRadius: 10,
    },
    typography: {
      fontFamily: "Arial, Helvetica, sans-serif",
      h1: { fontWeight: 700 },
      h2: { fontWeight: 700 },
      h4: { fontWeight: 700 },
      h5: { fontWeight: 700 },
      h6: { fontWeight: 700 },
      button: {
        fontWeight: 600,
        textTransform: "none",
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 9,
            paddingInline: 18,
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: {
            color: dark ? "#aab8ae" : "#66756d",
            fontWeight: 600,
            whiteSpace: "nowrap",
          },
        },
      },
    },
  });
}
