import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { isAuthenticated } from "../src/utils/auth";

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [auth, setAuth] = useState(false);

  useEffect(() => {
    isAuthenticated().then(result => {
      setAuth(result);
      setReady(true);
    });
  }, []);

  if (!ready) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {!auth ? (
        <Stack.Screen name="login" />
      ) : (
        <Stack.Screen name="(tabs)" />
      )}
    </Stack>
  );
}
