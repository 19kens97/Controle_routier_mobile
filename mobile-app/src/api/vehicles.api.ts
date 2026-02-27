import api from "./api";

export type PlateScanResponse = {
  success: boolean;
  message: string;
  data: {
    plate_number: string;
    confidence: number;
    vehicle_found: boolean;
    vehicle: Record<string, unknown> | null;
    mode: string;
  };
};

export async function scanPlateWithOcr(rawText: string): Promise<PlateScanResponse> {
  const res = await api.post("vehicles/plate-scan/", {
    raw_text: rawText,
  });
  return res.data;
}
