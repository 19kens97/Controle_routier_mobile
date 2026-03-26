import api from "./api";

export type HomeSync = {
  online: boolean;
  pendingCount: number;
  lastUpdatedAt: string;
};

export type HomeStats = {
  primaryLabel: string;
  primaryValue: string;
  secondaryLabel: string;
  secondaryValue: string;
};

export type HomeAlert = {
  id: string;
  title: string;
  desc: string;
  level: "HIGH" | "MEDIUM";
};

export type HomeActivity = {
  id: string;
  title: string;
  subtitle: string;
  status: "SUCCESS" | "WARNING" | "NEUTRAL";
};

export type HomeDashboardData = {
  sync: HomeSync;
  stats: HomeStats;
  alerts: HomeAlert[];
  activity: HomeActivity[];
};

type HomeDashboardApiResponse = {
  success: boolean;
  message: string;
  data: HomeDashboardData;
};

export async function fetchHomeDashboard() {
  const response = await api.get<HomeDashboardApiResponse>("stats/home-dashboard/");
  return response.data.data;
}
