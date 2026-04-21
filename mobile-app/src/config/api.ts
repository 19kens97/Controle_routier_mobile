import Constants from "expo-constants";

const DEV_LOOPBACK_API_BASE_URL = "http://127.0.0.1:8000/api/";
const PROD_FALLBACK_API_BASE_URL = "https://api.controle-routier.local/api/";

function extractExpoHostIp(hostUri?: string | null): string | null {
  if (!hostUri) return null;

  const sanitizedHost = hostUri
    .trim()
    .replace(/^[a-z]+:\/\//i, "")
    .split("/")[0]
    .split(":")[0];

  if (!sanitizedHost) return null;
  if (sanitizedHost === "localhost" || sanitizedHost === "127.0.0.1") return null;

  return sanitizedHost;
}

function getExpoDevApiBaseUrl(): string | null {
  const hostIp =
    extractExpoHostIp(Constants.expoConfig?.hostUri) ??
    extractExpoHostIp(Constants.platform?.hostUri);

  if (!hostIp) return null;

  return `http://${hostIp}:8000/api/`;
}

const DEFAULT_DEV_API_BASE_URL =
  getExpoDevApiBaseUrl() ?? DEV_LOOPBACK_API_BASE_URL;

function enforceSecureProtocol(url: string): string {
  if (__DEV__) return url;
  if (url.toLowerCase().startsWith("http://")) {
    return `https://${url.slice("http://".length)}`;
  }
  return url;
}

function normalizeApiBaseUrl(url: string): string {
  const trimmed = enforceSecureProtocol(url.trim());
  if (!trimmed) {
    return __DEV__ ? DEFAULT_DEV_API_BASE_URL : PROD_FALLBACK_API_BASE_URL;
  }
  return trimmed.endsWith("/") ? trimmed : `${trimmed}/`;
}

const envApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

export const API_BASE_URL = normalizeApiBaseUrl(
  envApiBaseUrl || DEFAULT_DEV_API_BASE_URL,
);

export const IS_FALLBACK_API_BASE_URL = !envApiBaseUrl;

export function apiUrl(path: string): string {
  const normalizedPath = path.replace(/^\/+/, "");
  return `${API_BASE_URL}${normalizedPath}`;
}
