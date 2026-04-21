import api from "./api";

export type HomeAlertItem = {
  id: string;
  title: string;
  desc: string;
  level: "HIGH" | "MEDIUM";
};

export type HomeActivityItem = {
  id: string;
  title: string;
  subtitle: string;
  status: "SUCCESS" | "WARNING" | "NEUTRAL";
};

export type HomeDashboardData = {
  sync: {
    online: boolean;
    pendingCount: number;
    lastUpdatedAt: string;
  };
  stats: {
    primaryLabel: string;
    primaryValue: string;
    secondaryLabel: string;
    secondaryValue: string;
  };
  alerts: HomeAlertItem[];
  activity: HomeActivityItem[];
};

export type GeminiConnectionTestData = {
  ok: boolean;
  configured: boolean;
  responseText: string | null;
  error: string | null;
  model?: string | null;
};

type HomeDashboardApiResponse = {
  success: boolean;
  message: string;
  data: HomeDashboardData;
};

type GeminiConnectionTestApiResponse = {
  success: boolean;
  message: string;
  data: GeminiConnectionTestData;
};

export async function fetchHomeDashboard() {
  const response = await api.get<HomeDashboardApiResponse>("stats/home-dashboard/");
  return response.data.data;
}

export async function testGeminiConnection() {
  const response = await api.get<GeminiConnectionTestApiResponse>(
    "stats/gemini-connection-test/"
  );
  return response.data;
}
