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

export type HomeAlertHistoryItem = HomeAlertItem & {
  ticketId: number;
  plateNumber: string;
  createdAt: string;
};

export type HomeRecentScanItem = {
  id: string;
  plateNumber: string;
  modelUsed: string;
  scannedAt: string;
  vehicle: {
    id: number;
    brand: string;
    model: string;
    color: string;
  } | null;
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

type HomeAlertsApiResponse = {
  success: boolean;
  message: string;
  data: {
    periodDays: number;
    count: number;
    items: HomeAlertHistoryItem[];
  };
};

type HomeRecentScansApiResponse = {
  success: boolean;
  message: string;
  data: {
    periodDays: number;
    count: number;
    items: HomeRecentScanItem[];
  };
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

export async function fetchHomeAlerts(days = 30) {
  const response = await api.get<HomeAlertsApiResponse>(`stats/home-alerts/?days=${days}`);
  return response.data.data;
}

export async function fetchHomeRecentScans(days = 30, limit = 20) {
  const response = await api.get<HomeRecentScansApiResponse>(
    `stats/home-recent-scans/?days=${days}&limit=${limit}`
  );
  return response.data.data;
}

export async function testGeminiConnection() {
  const response = await api.get<GeminiConnectionTestApiResponse>(
    "stats/gemini-connection-test/"
  );
  return response.data;
}
