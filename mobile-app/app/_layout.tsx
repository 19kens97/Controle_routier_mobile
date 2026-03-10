import React from "react";
import { ActivityIndicator, View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { theme } from "../constants/theme";
import { ThemeProvider, useAppTheme } from "../src/providers/theme.provider";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <RootNavigator />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function RootNavigator() {
  const { ready, resolvedTheme } = useAppTheme();

  if (!ready) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.colors.bg0,
        }}
      >
        <ActivityIndicator color={theme.colors.text} />
      </View>
    );
  }

  return (
    <>
      <StatusBar hidden style={resolvedTheme === "DARK" ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
