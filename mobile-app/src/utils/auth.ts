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

function decodeJwtPayload(token: string): { exp?: number } | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const json = atob(padded);

    return JSON.parse(json);
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  const exp = payload?.exp;

  if (!exp) return true;
  const nowInSeconds = Math.floor(Date.now() / 1000);
  return exp <= nowInSeconds;
}

async function tryRefreshTokens(): Promise<boolean> {
  const refresh = await SecureStore.getItemAsync(REFRESH_KEY);
  if (!refresh) return false;

  try {
    const res = await axios.post(apiUrl("users/token/refresh/"), { refresh });
    const newAccess = res?.data?.data?.access;
    const newRefresh = res?.data?.data?.refresh;

    if (!newAccess) return false;

    await SecureStore.setItemAsync(ACCESS_KEY, newAccess);
    if (newRefresh) {
      await SecureStore.setItemAsync(REFRESH_KEY, newRefresh);
    }

    return true;
  } catch {
    return false;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const access = await SecureStore.getItemAsync(ACCESS_KEY);
  const refresh = await SecureStore.getItemAsync(REFRESH_KEY);

  if (!access && !refresh) return false;

  if (access && !isTokenExpired(access)) {
    return true;
  }

  const refreshed = await tryRefreshTokens();
  if (refreshed) return true;

  await clearTokens();
  return false;
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
