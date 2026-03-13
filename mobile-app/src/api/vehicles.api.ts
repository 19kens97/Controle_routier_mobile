import * as SecureStore from "expo-secure-store";
import { API_BASE_URL } from "../config/api";

export type OcrEngine = "ai" | "tesseract";

export type PlateScanData = {
  plate: string | null;
  confidence: number;
  candidates: string[];
  raw_text: string;
  is_reliable: boolean;
};

export type PlateScanResponse = {
  success: boolean;
  message: string;
  data: PlateScanData;
};

const ACCESS_KEY = "access_token";

function inferMimeType(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

export async function scanVehiclePlate(imageUri: string, engine: OcrEngine) {
  const formData = new FormData();
  const mimeType = inferMimeType(imageUri);
  const fileName = imageUri.split("/").pop() || "plate.jpg";

  formData.append("image", {
    uri: imageUri,
    name: fileName,
    type: mimeType,
  } as any);

  formData.append("engine", engine);
  const token = await SecureStore.getItemAsync(ACCESS_KEY);

  const response = await fetch(`${API_BASE_URL}vehicles/scan-plate/`, {
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
      responseData = { message: responseText };
    }
  }

  if (!response.ok) {
    const error: any = new Error(
      responseData?.message || responseData?.detail || "Echec du scan OCR."
    );
    error.response = {
      status: response.status,
      data: responseData,
    };
    throw error;
  }

  return {
    data: responseData as PlateScanResponse,
  };
}
