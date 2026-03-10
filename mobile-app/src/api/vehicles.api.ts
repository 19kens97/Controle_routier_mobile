import api from "./api";

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

function inferMimeType(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

export async function scanVehiclePlate(imageUri: string, engine: OcrEngine = "ai") {
  const formData = new FormData();
  formData.append("engine", engine);
  formData.append("image", {
    uri: imageUri,
    name: `plate-scan-${Date.now()}.jpg`,
    type: inferMimeType(imageUri),
  } as any);

  const res = await api.post<PlateScanResponse>("vehicles/scan-plate/", formData);
  return res.data;
}
