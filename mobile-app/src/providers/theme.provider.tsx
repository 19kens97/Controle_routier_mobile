import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

import {
  AppTheme,
  applyThemeMode,
  createAppTheme,
  ResolvedTheme,
  theme,
  ThemeMode,
} from "../../constants/theme";
import { loadSettings, TextSize } from "../storage/settings.storage";

type ThemeContextValue = {
  theme: AppTheme;
  themeMode: ThemeMode;
  textSize: TextSize;
  resolvedTheme: ResolvedTheme;
  ready: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  setTextSize: (size: TextSize) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const fallbackValue: ThemeContextValue = {
  theme,
  themeMode: "SYSTEM",
  textSize: "NORMAL",
  resolvedTheme: "DARK",
  ready: true,
  setThemeMode: () => {},
  setTextSize: () => {},
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [appTheme, setAppTheme] = useState<AppTheme>(() => createAppTheme("SYSTEM"));
  const [themeMode, setThemeModeState] = useState<ThemeMode>("SYSTEM");
  const [textSize, setTextSizeState] = useState<TextSize>("NORMAL");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("SYSTEM");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const settings = await loadSettings();
        if (!mounted) return;
        const resolved = applyThemeMode(settings.themeMode);
        setAppTheme(createAppTheme(resolved, settings.textSize));
        setThemeModeState(settings.themeMode);
        setTextSizeState(settings.textSize);
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
    setAppTheme(createAppTheme(resolved, textSize));
    setThemeModeState(mode);
    setResolvedTheme(resolved);
  };

  const setTextSize = (size: TextSize) => {
    setAppTheme(createAppTheme(resolvedTheme, size));
    setTextSizeState(size);
  };

  const value = useMemo(
    () => ({
      theme: appTheme,
      themeMode,
      textSize,
      resolvedTheme,
      ready,
      setThemeMode,
      setTextSize,
    }),
    [appTheme, ready, resolvedTheme, textSize, themeMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const value = useContext(ThemeContext);
  return value ?? fallbackValue;
}
