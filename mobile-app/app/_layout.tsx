import React from "react";
import { ActivityIndicator, AppState, Platform, View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as NavigationBar from "expo-navigation-bar";

import { theme } from "../constants/theme";
import { ThemeProvider, useAppTheme } from "../src/providers/theme.provider";
import { configureNotificationChannel } from "../src/utils/notifications";

export default function RootLayout() {
  React.useEffect(() => {
    configureNotificationChannel().catch(() => undefined);
  }, []);

  React.useEffect(() => {
    if (Platform.OS !== "android") {
      return;
    }

    const applyImmersiveMode = () => {
      NavigationBar.setPositionAsync("absolute").catch(() => undefined);
      NavigationBar.setBehaviorAsync("overlay-swipe").catch(() => undefined);
      NavigationBar.setVisibilityAsync("hidden").catch(() => undefined);
      NavigationBar.setBackgroundColorAsync("#00000000").catch(() => undefined);
    };

    applyImmersiveMode();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        applyImmersiveMode();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

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
