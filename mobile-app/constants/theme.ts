import { Platform } from "react-native";

const tintColorLight = "#0A7EA4";
const tintColorDark = "#FFFFFF";

export const Colors = {
  light: {
    text: "#11181C",
    background: "#FFFFFF",
    tint: tintColorLight,
    icon: "#687076",
    tabIconDefault: "#687076",
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: "#ECEDEE",
    background: "#151718",
    tint: tintColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export type ThemeMode = "SYSTEM" | "LIGHT" | "DARK";
export type ResolvedTheme = ThemeMode;
export type ThemeTextSize = "SMALL" | "NORMAL" | "LARGE";

type ThemeColors = {
  bg0: string;
  bg1: string;
  bg2: string;
  surface: string;
  surface2: string;
  border: string;
  border2: string;
  text: string;
  textMuted: string;
  textDim: string;
  accent: string;
  accentSoft: string;
  accentBorder: string;
  danger: string;
  success: string;
};

export type AppTheme = {
  colors: ThemeColors;
  radius: {
    xl: number;
    lg: number;
    md: number;
    pill: number;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  font: {
    h1: number;
    h2: number;
    body: number;
    small: number;
  };
};

type ThemeScales = Omit<AppTheme, "colors">;

const LIGHT_BG_0 = "#FFF4E8";
const LIGHT_BG_1 = "#FFE1C2";
// const LIGHT_BG_2 = "#FFF0DE";
const LIGHT_BG_2 = "#FFF4E8";

// const LIGHT_SURFACE = "#FFF8F1";
const LIGHT_SURFACE = "#e6d0bb";
const LIGHT_SURFACE_2 = "#FCEBDA";
const LIGHT_BORDER = "rgba(150,76,33,0.24)";
const LIGHT_BORDER_2 = "rgba(150,76,33,0.14)";
const LIGHT_TEXT = "#2B160B";
const LIGHT_TEXT_MUTED = "rgba(43,22,11,0.72)";
const LIGHT_TEXT_DIM = "rgba(43,22,11,0.56)";
const LIGHT_ACCENT = "#E85D04";
const LIGHT_ACCENT_SOFT = "rgba(232,93,4,0.16)";
const LIGHT_ACCENT_BORDER = "rgba(232,93,4,0.30)";
const LIGHT_DANGER = "#C1121F";
const LIGHT_SUCCESS = "#1B8A5A";

const SYSTEM_BG_0 = "#EDF3FF";
const SYSTEM_BG_1 = "#D2E0FF";
const SYSTEM_BG_2 = "#E4ECFF";
const SYSTEM_SURFACE = "#F5F8FF";
const SYSTEM_SURFACE_2 = "#E4ECFA";
const SYSTEM_BORDER = "rgba(41,79,163,0.22)";
const SYSTEM_BORDER_2 = "rgba(41,79,163,0.12)";
const SYSTEM_TEXT = "#10203F";
const SYSTEM_TEXT_MUTED = "rgba(16,32,63,0.72)";
const SYSTEM_TEXT_DIM = "rgba(16,32,63,0.56)";
const SYSTEM_ACCENT = "#355CDE";
const SYSTEM_ACCENT_SOFT = "rgba(53,92,222,0.16)";
const SYSTEM_ACCENT_BORDER = "rgba(53,92,222,0.28)";
const SYSTEM_DANGER = "#C44536";
const SYSTEM_SUCCESS = "#1F8A70";

const DARK_COLORS: ThemeColors = {
  bg0: "#071321",
  bg1: "#0B2A4A",
  bg2: "#071321",
  surface: "rgba(7, 19, 33, 0.94)",
  surface2: "rgba(12, 35, 60, 0.96)",

  border: "rgba(133, 169, 214, 0.20)",
  border2: "rgba(133, 169, 214, 0.12)",
  text: "#FFFFFF",
  textMuted: "rgba(255,255,255,0.65)",
  textDim: "rgba(255,255,255,0.60)",
  accent: "rgba(255,215,0,0.95)",
  accentSoft: "rgba(255,215,0,0.12)",
  accentBorder: "rgba(255,215,0,0.22)",
  danger: "rgba(161, 90, 90, 0.95)",
  success: "rgba(160,255,190,0.95)",
};

const LIGHT_COLORS: ThemeColors = {
  bg0: LIGHT_BG_0,
  bg1: LIGHT_BG_1,
  bg2: LIGHT_BG_2,
  surface: LIGHT_SURFACE,
  surface2: LIGHT_SURFACE_2,
  border: LIGHT_BORDER,
  border2: LIGHT_BORDER_2,
  text: LIGHT_TEXT,
  textMuted: LIGHT_TEXT_MUTED,
  textDim: LIGHT_TEXT_DIM,
  accent: LIGHT_ACCENT,
  accentSoft: LIGHT_ACCENT_SOFT,
  accentBorder: LIGHT_ACCENT_BORDER,
  danger: LIGHT_DANGER,
  success: LIGHT_SUCCESS,
};

const SYSTEM_COLORS: ThemeColors = {
  bg0: SYSTEM_BG_0,
  bg1: SYSTEM_BG_1,
  bg2: SYSTEM_BG_2,
  surface: SYSTEM_SURFACE,
  surface2: SYSTEM_SURFACE_2,
  border: SYSTEM_BORDER,
  border2: SYSTEM_BORDER_2,
  text: SYSTEM_TEXT,
  textMuted: SYSTEM_TEXT_MUTED,
  textDim: SYSTEM_TEXT_DIM,
  accent: SYSTEM_ACCENT,
  accentSoft: SYSTEM_ACCENT_SOFT,
  accentBorder: SYSTEM_ACCENT_BORDER,
  danger: SYSTEM_DANGER,
  success: SYSTEM_SUCCESS,
};

const PALETTES: Record<ThemeMode, ThemeColors> = {
  DARK: DARK_COLORS,
  LIGHT: LIGHT_COLORS,
  SYSTEM: SYSTEM_COLORS,
};

const THEME_SCALES: ThemeScales = {
  radius: {
    xl: 22,
    lg: 18,
    md: 14,
    pill: 999,
  },
  spacing: {
    xs: 6,
    sm: 10,
    md: 14,
    lg: 18,
    xl: 24,
  },
  font: {
    h1: 22,
    h2: 18,
    body: 14,
    small: 12,
  },
};

function getFontScale(size: ThemeTextSize) {
  return size === "SMALL" ? 0.92 : size === "LARGE" ? 1.12 : 1;
}

export function createAppTheme(
  resolved: ResolvedTheme,
  textSize: ThemeTextSize = "NORMAL"
): AppTheme {
  const scale = getFontScale(textSize);

  return {
    ...THEME_SCALES,
    colors: { ...PALETTES[resolved] },
    font: {
      h1: Math.round(THEME_SCALES.font.h1 * scale),
      h2: Math.round(THEME_SCALES.font.h2 * scale),
      body: Math.round(THEME_SCALES.font.body * scale),
      small: Math.round(THEME_SCALES.font.small * scale),
    },
  };
}

export function getTabBarColors(resolved: ResolvedTheme) {
  const colors = PALETTES[resolved];
  return {
    background: colors.surface,
    border: colors.border2,
    active: colors.accent,
    inactive: colors.textDim,
  } as const;
}

export const theme: AppTheme = createAppTheme("DARK");

export function resolveTheme(mode: ThemeMode): ResolvedTheme {
  return mode;
}

export function applyResolvedTheme(resolved: ResolvedTheme): void {
  Object.assign(theme.colors, PALETTES[resolved]);
}

export function applyThemeMode(mode: ThemeMode): ResolvedTheme {
  const resolved = resolveTheme(mode);
  applyResolvedTheme(resolved);
  return resolved;
}
 