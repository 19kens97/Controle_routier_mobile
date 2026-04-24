import AsyncStorage from "@react-native-async-storage/async-storage";

export type ScanSource = "CAMERA" | "GALLERY";
export type ScanStatus = "SUCCESS" | "NO_PLATE" | "ERROR";

export type ScanHistoryItem = {
  id: string;
  scannedAt: string;
  source: ScanSource;
  status: ScanStatus;
  plateNumber: string | null;
  confidence: number | null;
};

const KEY = "cr_scan_history_v1";
const MAX_ITEMS = 30;

export async function loadScanHistory(): Promise<ScanHistoryItem[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item) => {
      return (
        item &&
        typeof item.id === "string" &&
        typeof item.scannedAt === "string" &&
        (item.source === "CAMERA" || item.source === "GALLERY") &&
        (item.status === "SUCCESS" || item.status === "NO_PLATE" || item.status === "ERROR")
      );
    });
  } catch {
    return [];
  }
}

export async function appendScanHistory(entry: ScanHistoryItem): Promise<ScanHistoryItem[]> {
  const existing = await loadScanHistory();
  const next = [entry, ...existing].slice(0, MAX_ITEMS);
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export async function getLatestScan(): Promise<ScanHistoryItem | null> {
  const history = await loadScanHistory();
  return history.length > 0 ? history[0] : null;
}
