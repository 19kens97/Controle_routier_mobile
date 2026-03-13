import Constants from "expo-constants";

const HARDCODED_FALLBACK_API_BASE_URL = "http://192.168.0.110:8000/api/";

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
  getExpoDevApiBaseUrl() ?? HARDCODED_FALLBACK_API_BASE_URL;

function normalizeApiBaseUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return DEFAULT_DEV_API_BASE_URL;
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
