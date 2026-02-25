// src/storage/settings.storage.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ThemeMode = "SYSTEM" | "LIGHT" | "DARK";
export type TextSize = "SMALL" | "NORMAL" | "LARGE";
export type SyncPolicy = "WIFI_ONLY" | "ALWAYS";

export type AppSettings = {
  themeMode: ThemeMode;
  language: "FR" | "HT";
  textSize: TextSize;

  offlineMode: boolean;
  syncPolicy: SyncPolicy;

  notifPriorityAlerts: boolean;
  notifExpiredDocs: boolean;
  notifEndShift: boolean;

  maskSensitive: boolean;
};

const KEY = "cr_app_settings_v1";

const DEFAULTS: AppSettings = {
  themeMode: "SYSTEM",
  language: "FR",
  textSize: "NORMAL",

  offlineMode: false,
  syncPolicy: "ALWAYS",

  notifPriorityAlerts: true,
  notifExpiredDocs: true,
  notifEndShift: false,

  maskSensitive: true,
};

export async function loadSettings(): Promise<AppSettings> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return DEFAULTS;
  try {
    const parsed = JSON.parse(raw);
    return { ...DEFAULTS, ...parsed };
  } catch {
    return DEFAULTS;
  }
}

export async function saveSettings(next: AppSettings): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}

export async function resetSettings(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}