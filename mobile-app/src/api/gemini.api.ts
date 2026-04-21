import * as SecureStore from "expo-secure-store";

import { API_BASE_URL } from "../config/api";

const ACCESS_KEY = "access_token";

function inferMimeType(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

function buildGeminiEndpoint(): string {
  const rawPath = (process.env.EXPO_PUBLIC_GEMINI_SCAN_PATH || "gemini/scan-plate/").trim();
  const normalizedPath = rawPath.replace(/^\/+/, "");
  return `${API_BASE_URL}${normalizedPath}`;
}

export type GeminiDirectScanResult = {
  plateNumber: string | null;
  rawResponse: any;
};

export async function scanGeminiDirect(imageUri: string): Promise<GeminiDirectScanResult> {
  const formData = new FormData();
  const mimeType = inferMimeType(imageUri);
  const fileName = imageUri.split("/").pop() || "plate.jpg";

  formData.append(
    "image",
    {
      uri: imageUri,
      name: fileName,
      type: mimeType,
    } as any
  );

  const token = await SecureStore.getItemAsync(ACCESS_KEY);
  const response = await fetch(buildGeminiEndpoint(), {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });

  const responseText = await response.text();
  let responseData: any = null;

  if (responseText) {
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }
  }

  if (!response.ok) {
    const error: any = new Error(
      responseData?.message || responseData?.detail || "Echec du test Gemini."
    );
    error.response = {
      status: response.status,
      data: responseData,
    };
    throw error;
  }

  const plateNumber =
    responseData?.plate_number ??
    responseData?.data?.plate_number ??
    responseData?.data?.plate ??
    responseData?.plate ??
    null;

  return {
    plateNumber: typeof plateNumber === "string" && plateNumber.trim() ? plateNumber : null,
    rawResponse: responseData,
  };
}
