import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { Linking } from "react-native";

import SettingsScreen from "../app/(tabs)/settings";
import { getUserProfile } from "../src/api/users.api";
import { loadSettings, saveSettings } from "../src/storage/settings.storage";
import {
  getNotificationPermissionState,
  requestNotificationPermission,
  sendTestNotification,
} from "../src/utils/notifications";

jest.mock("expo-router", () => ({
  router: {
    replace: jest.fn(),
    push: jest.fn(),
    back: jest.fn(),
  },
}));

jest.mock("expo-application", () => ({
  nativeApplicationVersion: "1.0.0",
  nativeBuildVersion: "1",
}));

jest.mock("expo-blur", () => ({
  BlurView: () => null,
}));

jest.mock("../src/api/users.api", () => ({
  getUserProfile: jest.fn(),
}));

jest.mock("../src/api/auth.api", () => ({
  changePassword: jest.fn(),
  logout: jest.fn(),
}));

jest.mock("../src/storage/settings.storage", () => ({
  loadSettings: jest.fn(),
  saveSettings: jest.fn(),
  resetSettings: jest.fn(),
}));

jest.mock("../src/utils/notifications", () => ({
  getNotificationPermissionState: jest.fn(),
  requestNotificationPermission: jest.fn(),
  sendTestNotification: jest.fn(),
}));

const defaultSettings = {
  themeMode: "SYSTEM",
  language: "FR",
  textSize: "NORMAL",
  offlineMode: false,
  syncPolicy: "ALWAYS",
  notifEnabled: true,
  notifPriorityAlerts: true,
  notifExpiredDocs: true,
  notifEndShift: false,
  maskSensitive: true,
} as const;

describe("Settings screen", () => {
  beforeEach(() => {
    (loadSettings as jest.Mock).mockResolvedValue(defaultSettings);
    (getUserProfile as jest.Mock).mockResolvedValue({
      data: {
        username: "agent.demo",
        first_name: "Jean",
        last_name: "Dupont",
        email: "agent@example.com",
        role: "AGENT_TERRAIN",
      },
    });
    (getNotificationPermissionState as jest.Mock).mockResolvedValue("granted");
    (requestNotificationPermission as jest.Mock).mockResolvedValue("granted");
    (sendTestNotification as jest.Mock).mockResolvedValue(undefined);
    jest.spyOn(Linking, "openSettings").mockResolvedValue();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders loaded profile and settings sections", async () => {
    const { findByText, getByText, getAllByText } = render(<SettingsScreen />);

    await findByText("Paramètres");

    expect(getByText("agent.demo")).toBeTruthy();
    expect(getAllByText(/Pr.+rences/i).length).toBeGreaterThan(0);
    expect(getAllByText(/Terrain/i).length).toBeGreaterThan(0);
  });

  it("saves toggled language setting", async () => {
    const { findByText, getByText } = render(<SettingsScreen />);

    await findByText("Langue");
    fireEvent.press(getByText("Langue"));

    await waitFor(() => {
      expect(saveSettings).toHaveBeenCalledWith(
        expect.objectContaining({ language: "HT" }),
      );
    });
  });

  it("requests permissions and enables notifications", async () => {
    (loadSettings as jest.Mock).mockResolvedValue({
      ...defaultSettings,
      notifEnabled: false,
    });

    const { findByText, getByText, getAllByRole } = render(<SettingsScreen />);

    await findByText("Activer les notifications");

    const switches = getAllByRole("switch");
    fireEvent(switches[1], "valueChange", true);

    await waitFor(() => {
      expect(requestNotificationPermission).toHaveBeenCalled();
      expect(saveSettings).toHaveBeenCalledWith(
        expect.objectContaining({ notifEnabled: true }),
      );
    });

    expect(getByText(/Autorisation systeme accordee/i)).toBeTruthy();
  });

  it("sends a test notification when enabled", async () => {
    const { findByText, getByText } = render(<SettingsScreen />);

    await findByText("Envoyer une notification de test");
    fireEvent.press(getByText("Envoyer une notification de test"));

    await waitFor(() => {
      expect(sendTestNotification).toHaveBeenCalled();
    });
  });
});

