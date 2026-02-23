// import * as SecureStore from "expo-secure-store";
// import { notifyAuthChanged } from "./authEvents";
// import api from "../api/api";

// const ACCESS_KEY = "access_token";
// const REFRESH_KEY = "refresh_token";

// export const saveTokens = async (access: string, refresh: string) => {
//   if (typeof access !== "string" || typeof refresh !== "string") {
//     throw new Error("Tokens invalides");
//   }
//   await SecureStore.setItemAsync(ACCESS_KEY, access);
//   await SecureStore.setItemAsync(REFRESH_KEY, refresh);
//   notifyAuthChanged();
// };

// export async function isAuthenticated(): Promise<boolean> {
//   const token = await SecureStore.getItemAsync(ACCESS_KEY);
//   return !!token;
// }

// export const clearTokens = async () => {
//   await SecureStore.deleteItemAsync(ACCESS_KEY);
//   await SecureStore.deleteItemAsync(REFRESH_KEY);
//   notifyAuthChanged();
// };

// function getLogoutPath() {
//   const base = api.defaults.baseURL ?? "";
//   return base.endsWith("/api/users/") ? "logout/" : "users/logout/";
// }

// export async function logout() {
//   const refresh = await SecureStore.getItemAsync(REFRESH_KEY);

//   try {
//     if (refresh) {
//       await api.post(getLogoutPath(), { refresh });
//     }
//   } catch (e) {
//     // Même si backend échoue (offline), on logout local.
//   } finally {
//     await clearTokens();
//   }
// }

// export async function getAccessToken() {
//   return SecureStore.getItemAsync(ACCESS_KEY);
// }






import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { notifyAuthChanged } from "./authEvents";

const ACCESS_KEY = "access_token";
const REFRESH_KEY = "refresh_token";
const BASE_URL = "http://192.168.0.110:8000/api/"; // adapte si besoin

export const saveTokens = async (access: string, refresh: string) => {
  await SecureStore.setItemAsync(ACCESS_KEY, access);
  await SecureStore.setItemAsync(REFRESH_KEY, refresh);
  notifyAuthChanged();
};

export async function isAuthenticated(): Promise<boolean> {
  const token = await SecureStore.getItemAsync(ACCESS_KEY);
  return !!token;
}

export const clearTokens = async () => {
  await SecureStore.deleteItemAsync(ACCESS_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
  notifyAuthChanged();
};

export async function logout() {
  const refresh = await SecureStore.getItemAsync(REFRESH_KEY);
  try {
    if (refresh) {
      // mets le bon endpoint logout si tu l’as
      await axios.post(`${BASE_URL}users/logout/`, { refresh });
    }
  } catch (e) {
    // ignore
  } finally {
    await clearTokens();
  }
}