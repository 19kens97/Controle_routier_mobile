import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";

import SettingsScreen from "../app/(tabs)/settings";
import { getUserProfile } from "../src/api/users.api";
import { loadSettings, saveSettings } from "../src/storage/settings.storage";

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

const defaultSettings = {
  themeMode: "SYSTEM",
  language: "FR",
  textSize: "NORMAL",
  offlineMode: false,
  syncPolicy: "ALWAYS",
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
  });

  it("renders loaded profile and settings sections", async () => {
    const { findByText, getByText, getAllByText } = render(<SettingsScreen />);

    await findByText(/Param/i);

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
});

