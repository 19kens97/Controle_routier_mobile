import React from "react";
import { render, waitFor } from "@testing-library/react-native";

import StatsScreen from "../app/(tabs)/stats";
import { fetchDashboardStats } from "../src/api/stats.api";
import { mockDashboardStats } from "../src/mocks/stats.mock";

jest.mock("expo-linear-gradient", () => ({
  LinearGradient: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("../src/api/stats.api", () => ({
  fetchDashboardStats: jest.fn(),
}));

jest.mock("../src/storage/settings.storage", () => ({
  loadSettings: jest.fn().mockResolvedValue({
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
  }),
}));

describe("Stats screen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders live dashboard data when backend responds", async () => {
    (fetchDashboardStats as jest.Mock).mockResolvedValueOnce({
      generatedAt: "2026-03-20T10:30:00Z",
      headline: "Activite en progression sur les derniers jours",
      subheadline: "12 PV enregistres, 3 agents actifs et 4 documents expires suivis.",
      metrics: [
        {
          id: "tickets",
          label: "PV saisis",
          value: 12,
          formattedValue: "12",
          deltaLabel: "+50% vs periode precedente",
          direction: "up",
          tone: "success",
        },
      ],
      activity: {
        title: "Activite journaliere",
        points: [
          { label: "Lun", value: 1 },
          { label: "Mar", value: 2 },
          { label: "Mer", value: 3 },
        ],
      },
      infractions: {
        title: "Infractions dominantes",
        items: [
          { label: "Vitesse", value: 5, formattedValue: "5 cas", color: "#E85D04" },
        ],
      },
      hotspots: {
        title: "Zones les plus actives",
        items: [{ id: "h1", label: "Delmas 33", value: 6, meta: "6 controles" }],
      },
      recentActivity: [
        {
          id: "1",
          title: "PV enregistre pour AA-12034",
          subtitle: "Exces de vitesse - Delmas 33",
          timeLabel: "Il y a 15 min",
          status: "warning",
        },
      ],
      alerts: [
        {
          id: "expired-documents",
          title: "Documents expires detectes",
          description: "4 documents necessitent une verification rapide.",
          tone: "danger",
        },
      ],
    });

    const { getByText, queryByText } = render(<StatsScreen />);

    await waitFor(() => {
      expect(fetchDashboardStats).toHaveBeenCalledTimes(1);
      expect(getByText("Source live")).toBeTruthy();
      expect(getByText("Activite en progression sur les derniers jours")).toBeTruthy();
      expect(
        getByText(
          "Vue generale des controles, zones suivies et alertes utiles, sans detail individuel des agents."
        )
      ).toBeTruthy();
      expect(getByText("12")).toBeTruthy();
      expect(queryByText("Agents les plus actifs")).toBeNull();
      expect(queryByText("Nadia Pierre")).toBeNull();
      expect(queryByText("Chargement des statistiques...")).toBeNull();
    });
  });

  it("falls back to mock dashboard data when the API fails", async () => {
    (fetchDashboardStats as jest.Mock).mockRejectedValueOnce({
      response: { data: { message: "Erreur backend stats" } },
    });

    const { findByText, getByText } = render(<StatsScreen />);

    expect(await findByText("Mode demonstration")).toBeTruthy();
    expect(getByText("Erreur backend stats Affichage du jeu de donnees local.")).toBeTruthy();
    expect(getByText(mockDashboardStats.headline)).toBeTruthy();
  });
});
