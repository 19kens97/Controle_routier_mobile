import * as SecureStore from "expo-secure-store";
import { API_BASE_URL } from "../config/api";
import api from "./api";

export type OcrEngine = "ai" | "tesseract";

export type PlateScanData = {
  plate: string | null;
  confidence: number;
  candidates: string[];
  raw_text: string;
  is_reliable: boolean;
  source: string;
};

export type PlateScanResponse = {
  success: boolean;
  message: string;
  data: PlateScanData;
};

export type VehicleCardData = {
  id: number;
  vehicle: number;
  card_number: string;
  issue_date: string;
  expiration_date: string;
  status: string;
  printed_by: string;
  category: string;
};

export type VehicleInsuranceData = {
  id: number;
  vehicle: number;
  company_name: string;
  policy_number: string;
  issued_date: string;
  expiration_date: string;
  is_active: boolean;
};

export type VehicleRegistrationData = {
  id: number;
  vehicle: number;
  registration_code: string;
  registration_type: string;
  issued_date: string;
  expiry_date: string;
};

export type VehicleLookupData = {
  id: number;
  plate_number: string;
  brand: string;
  model: string;
  color: string;
  year: number;
  vehicle_cards: VehicleCardData[];
  insurances: VehicleInsuranceData[];
  registration: VehicleRegistrationData | null;
};

export type VehicleLookupResponse = {
  success: boolean;
  message: string;
  data: VehicleLookupData;
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

export async function searchVehicleByPlate(plateNumber: string) {
  const response = await api.get<VehicleLookupResponse>("vehicles/search/", {
    params: { plate_number: plateNumber },
  });

  return response.data;
}
