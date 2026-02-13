/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

// constants/theme.ts
export const theme = {
  colors: {
    // Backgrounds
    bg0: "#071321",
    bg1: "#0B2A4A",
    bg2: "#071321",

    // Surfaces (cards, inputs)
    surface: "rgba(255,255,255,0.08)",
    surface2: "rgba(255,255,255,0.06)",
    border: "rgba(255,255,255,0.14)",
    border2: "rgba(255,255,255,0.10)",

    // Text
    text: "#FFFFFF",
    textMuted: "rgba(255,255,255,0.65)",
    textDim: "rgba(255,255,255,0.60)",

    // Brand / Accent
    accent: "rgba(255,215,0,0.95)",
    accentSoft: "rgba(255,215,0,0.12)",
    accentBorder: "rgba(255,215,0,0.22)",

    // Status
    danger: "rgba(255,180,180,0.95)",
    success: "rgba(160,255,190,0.95)",
  },

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
} as const;
