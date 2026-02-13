import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { logout } from "../../src/utils/auth";

export default function LogoutScreen() {
  useEffect(() => {
    async function handle() {
      await logout();
      router.replace("/login");
    }

    handle();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
