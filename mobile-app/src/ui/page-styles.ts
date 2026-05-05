import { StyleSheet } from "react-native";

import { AppTheme } from "../../constants/theme";

export function getPageInsets(theme: AppTheme) {
  return {
    horizontal: theme.spacing.md,
    vertical: theme.spacing.lg,
  };
}

export function createPageStyles(theme: AppTheme) {
  const insets = getPageInsets(theme);

  return StyleSheet.create({
    content: {
      paddingHorizontal: insets.horizontal,
      paddingTop: insets.vertical,
      paddingBottom: insets.vertical,
      gap: 12,
    },
    title: {
      color: theme.colors.text,
      fontSize: theme.font.h1,
      fontWeight: "900",
    },
    subtitle: {
      color: theme.colors.textDim,
      fontSize: theme.font.small,
      marginTop: -4,
    },
    card: {
      borderRadius: theme.radius.lg,
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      gap: 10,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    cardTitle: {
      color: theme.colors.text,
      fontWeight: "900",
      fontSize: theme.font.body,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.colors.border2,
      borderRadius: theme.radius.md,
      paddingHorizontal: 12,
      paddingVertical: 12,
      color: theme.colors.text,
      backgroundColor: theme.colors.surface2,
      fontWeight: "700",
      fontSize: theme.font.body,
    },
    primaryButton: {
      borderRadius: theme.radius.md,
      paddingVertical: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.accentSoft,
      borderWidth: 1,
      borderColor: theme.colors.accentBorder,
    },
    primaryButtonText: {
      color: theme.colors.text,
      fontWeight: "900",
      fontSize: theme.font.body,
    },
    secondaryButton: {
      borderRadius: theme.radius.md,
      paddingVertical: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.surface2,
      borderWidth: 1,
      borderColor: theme.colors.border2,
    },
    secondaryButtonText: {
      color: theme.colors.text,
      fontWeight: "800",
      fontSize: theme.font.body,
    },
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
  });
}
