import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { isAuthenticated } from "../src/utils/auth";

export default function Index() {
  const [ready, setReady] = useState(false);
  const [auth, setAuth] = useState(false);

  useEffect(() => {
    (async () => {
      const ok = await isAuthenticated();
      setAuth(ok);
      setReady(true);
    })();
  }, []);

  if (!ready) return null;
  return <Redirect href={auth ? "/(tabs)" : "/login"} />;
}
