import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  loadSettings,
  resetSettings,
  saveSettings,
  type AppSettings,
} from "./settings.storage";

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

const mockedStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

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

describe("settings.storage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns defaults when storage is empty", async () => {
    mockedStorage.getItem.mockResolvedValueOnce(null);

    const data = await loadSettings();

    expect(data).toEqual(DEFAULTS);
  });

  it("merges stored values with defaults", async () => {
    mockedStorage.getItem.mockResolvedValueOnce(
      JSON.stringify({ language: "HT", offlineMode: true }),
    );

    const data = await loadSettings();

    expect(data).toEqual({
      ...DEFAULTS,
      language: "HT",
      offlineMode: true,
    });
  });

  it("falls back to defaults when JSON is invalid", async () => {
    mockedStorage.getItem.mockResolvedValueOnce("{invalid_json");

    const data = await loadSettings();

    expect(data).toEqual(DEFAULTS);
  });

  it("persists settings", async () => {
    await saveSettings(DEFAULTS);

    expect(mockedStorage.setItem).toHaveBeenCalledWith(
      "cr_app_settings_v1",
      JSON.stringify(DEFAULTS),
    );
  });

  it("resets settings", async () => {
    await resetSettings();

    expect(mockedStorage.removeItem).toHaveBeenCalledWith("cr_app_settings_v1");
  });
});
