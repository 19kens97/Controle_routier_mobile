import React, { useMemo } from "react";
import { StyleSheet, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppTheme } from "../src/providers/theme.provider";

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
  edges?: ("top" | "bottom" | "left" | "right")[];
};

export default function Screen({
  children,
  style,
  edges = ["top", "left", "right"],
}: Props) {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(), []);

  return (
    <LinearGradient
      colors={[theme.colors.bg0, theme.colors.bg1, theme.colors.bg2]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={[styles.safe, style]} edges={edges}>
        {children}
      </SafeAreaView>
    </LinearGradient>
  );
}

function createStyles() {
  return StyleSheet.create({
    gradient: { flex: 1 },
    safe: { flex: 1 },
  });
}
