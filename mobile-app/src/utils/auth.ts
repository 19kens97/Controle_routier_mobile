import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { apiUrl } from "../config/api";
import { notifyAuthChanged } from "./authEvents";

const ACCESS_KEY = "access_token";
const REFRESH_KEY = "refresh_token";
export async function saveTokens(access: string, refresh: string) {
  await SecureStore.setItemAsync(ACCESS_KEY, access);
  await SecureStore.setItemAsync(REFRESH_KEY, refresh);
  notifyAuthChanged();
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await SecureStore.getItemAsync(ACCESS_KEY);
  return Boolean(token);
}

export async function clearTokens() {
  await SecureStore.deleteItemAsync(ACCESS_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
  notifyAuthChanged();
}

export async function logout() {
  const refresh = await SecureStore.getItemAsync(REFRESH_KEY);

  try {
    if (refresh) {
      await axios.post(apiUrl("users/logout/"), { refresh });
    }
  } catch {
    // Logout must still clear local session when backend logout fails.
  } finally {
    await clearTokens();
  }
}
