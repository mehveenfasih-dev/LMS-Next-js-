"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import {
  ThemeProvider as MuiThemeProvider,
  CssBaseline,
} from "@mui/material";
import { createAppTheme } from "./theme";

export type ColorMode = "light" | "dark";

type ColorModeContextValue = {
  mode: ColorMode;
  toggleColorMode: () => void;
};

const ColorModeContext = createContext<ColorModeContextValue | null>(null);
const STORAGE_KEY = "library.colorMode";

export function ThemeProvider({ children }: PropsWithChildren) {
  const [mode, setMode] = useState<ColorMode>("light");
  const [ready, setReady] = useState(false);
  const theme = useMemo(() => createAppTheme(mode), [mode]);
  const value = useMemo(
    () => ({
      mode,
      toggleColorMode: () =>
        setMode((current) => (current === "light" ? "dark" : "light")),
    }),
    [mode],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const savedMode = window.localStorage.getItem(STORAGE_KEY);
      if (savedMode === "light" || savedMode === "dark") {
        setMode(savedMode);
      }
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.body.dataset.theme = mode;
    window.localStorage.setItem(STORAGE_KEY, mode);
  }, [mode, ready]);

  return (
    <ColorModeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ColorModeContext.Provider>
  );
}

export function useColorMode() {
  const context = useContext(ColorModeContext);
  if (!context) {
    throw new Error("useColorMode must be used within a ThemeProvider.");
  }
  return context;
}
