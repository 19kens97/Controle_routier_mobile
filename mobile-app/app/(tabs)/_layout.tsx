import React from "react";
import { ActivityIndicator, View } from "react-native";
import { Redirect, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { getTabBarColors } from "../../constants/theme";
import { useAppTheme } from "../../src/providers/theme.provider";
import { isAuthenticated } from "../../src/utils/auth";
import { onAuthChanged } from "../../src/utils/authEvents";

export default function TabsLayout() {
  const { resolvedTheme, theme } = useAppTheme();
  const tabBarColors = getTabBarColors(resolvedTheme);
  const [ready, setReady] = React.useState(false);
  const [auth, setAuth] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;

    const refreshAuth = async () => {
      const ok = await isAuthenticated();
      if (!mounted) return;
      setAuth(ok);
      setReady(true);
    };

    void refreshAuth();
    const unsubscribe = onAuthChanged(() => {
      void refreshAuth();
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

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

  if (!auth) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: tabBarColors.background,
          borderTopColor: tabBarColors.border,
        },
        tabBarActiveTintColor: tabBarColors.active,
        tabBarInactiveTintColor: tabBarColors.inactive,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Accueil",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="documents"
        options={{
          title: "Documents",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "folder" : "folder-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="stats"
        options={{
          title: "Stats",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "stats-chart" : "stats-chart-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: "Paramètres",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "settings" : "settings-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
