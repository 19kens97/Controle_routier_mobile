import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

import {
  AppTheme,
  applyThemeMode,
  ResolvedTheme,
  theme,
  ThemeMode,
} from "../../constants/theme";
import { loadSettings } from "../storage/settings.storage";

type ThemeContextValue = {
  theme: AppTheme;
  themeMode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  ready: boolean;
  setThemeMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const fallbackValue: ThemeContextValue = {
  theme,
  themeMode: "SYSTEM",
  resolvedTheme: "DARK",
  ready: true,
  setThemeMode: () => {},
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>("SYSTEM");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("SYSTEM");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const settings = await loadSettings();
        if (!mounted) return;
        const resolved = applyThemeMode(settings.themeMode);
        setThemeModeState(settings.themeMode);
        setResolvedTheme(resolved);
      } finally {
        if (mounted) setReady(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const setThemeMode = (mode: ThemeMode) => {
    const resolved = applyThemeMode(mode);
    setThemeModeState(mode);
    setResolvedTheme(resolved);
  };

  const value = useMemo(
    () => ({
      theme,
      themeMode,
      resolvedTheme,
      ready,
      setThemeMode,
    }),
    [ready, resolvedTheme, themeMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const value = useContext(ThemeContext);
  return value ?? fallbackValue;
}
