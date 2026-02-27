const DEFAULT_DEV_API_BASE_URL = "http://192.168.0.110:8000/api/";

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
