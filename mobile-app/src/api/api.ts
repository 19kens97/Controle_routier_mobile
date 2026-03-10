// src/api/api.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import * as SecureStore from "expo-secure-store";
import { apiUrl, API_BASE_URL } from "../config/api";
import { clearTokens } from "../utils/auth";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

const ACCESS_KEY = "access_token";
const REFRESH_KEY = "refresh_token";

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const isFormData = typeof FormData !== "undefined" && config.data instanceof FormData;
  if (isFormData) {
    // Important for React Native: remove JSON content-type so runtime can set multipart boundary.
    const headers: any = config.headers;
    if (typeof headers?.delete === "function") {
      headers.delete("Content-Type");
      headers.delete("content-type");
    } else if (headers) {
      delete headers["Content-Type"];
      delete headers["content-type"];
    }
  }

  const token = await SecureStore.getItemAsync(ACCESS_KEY);
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Anti-concurrence refresh (si plusieurs requêtes 401 en même temps) ---
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refresh = await SecureStore.getItemAsync(REFRESH_KEY);
  if (!refresh) return null;

  const url = apiUrl("users/token/refresh/");

  const res = await axios.post(
    url,
    { refresh },
    { headers: { "Content-Type": "application/json" } }
  );

  // ✅ car ton backend renvoie success_response(data={access, refresh})
  const newAccess = res?.data?.data?.access;
  const newRefresh = res?.data?.data?.refresh;

  if (!newAccess) return null;

  await SecureStore.setItemAsync(ACCESS_KEY, newAccess);
  if (newRefresh) await SecureStore.setItemAsync(REFRESH_KEY, newRefresh);

  return newAccess;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const originalRequest: any = error.config;
    const reqUrl = originalRequest?.url ?? "";
    if (reqUrl.includes("token/refresh")) return Promise.reject(error);   
    // si pas 401, laisse passer
    if (status !== 401) return Promise.reject(error);

    // évite boucle infinie
    if (originalRequest?._retry) return Promise.reject(error);
    originalRequest._retry = true;

    try {
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = refreshAccessToken().finally(() => {
          isRefreshing = false;
        });
      }

      const newToken = await refreshPromise;

      if (!newToken) {
        await clearTokens(); // déconnecte proprement
        return Promise.reject(error);
      }

      // rejouer la requête originale avec le nouveau token
      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers.Authorization = `Bearer ${newToken}`;

      return api(originalRequest);
    } catch {
      await clearTokens();
      return Promise.reject(error);
    }
  }
);

export default api;
