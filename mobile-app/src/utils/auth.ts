import * as SecureStore from "expo-secure-store";
import { notifyAuthChanged } from "./authEvents";
import api from "../api/api";

export const saveTokens = async (access: string, refresh: string) => {
  if (typeof access !== "string" || typeof refresh !== "string") {
    throw new Error("Tokens invalides");
  }
  await SecureStore.setItemAsync("access", access);
  await SecureStore.setItemAsync("refresh", refresh);
  notifyAuthChanged();
};

export async function isAuthenticated(): Promise<boolean> {
  const token = await SecureStore.getItemAsync("access");
  return !!token;
}

export const clearTokens = async () => {
  await SecureStore.deleteItemAsync("access");
  await SecureStore.deleteItemAsync("refresh");
  notifyAuthChanged();
};

function getLogoutPath() {
  // Exemple:
  // baseURL = http://.../api/        => users/logout/
  // baseURL = http://.../api/users/  => logout/
  const base = api.defaults.baseURL ?? "";
  return base.endsWith("/api/users/") ? "logout/" : "users/logout/";
}

export async function logout() {
  const refresh = await SecureStore.getItemAsync("refresh");

  try {
    if (refresh) {
      await api.post(getLogoutPath(), { refresh });
    }
  } catch (e) {
    // Même si backend échoue (offline), on logout local.
  } finally {
    // ✅ Important: utilise clearTokens pour notifier l'app
    await clearTokens();
  }
}
