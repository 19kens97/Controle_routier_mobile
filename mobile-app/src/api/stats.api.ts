import api from "./api";

export type TrendDirection = "up" | "down" | "neutral";
export type MetricTone = "default" | "success" | "warning" | "danger";
export type DataSource = "live" | "mock";

export type StatsMetric = {
  id: string;
  label: string;
  value: number;
  formattedValue: string;
  deltaLabel: string;
  direction: TrendDirection;
  tone: MetricTone;
};

export type ActivityPoint = {
  label: string;
  value: number;
};

export type DistributionItem = {
  label: string;
  value: number;
  formattedValue: string;
  color: string;
};

export type RankingItem = {
  id: string;
  label: string;
  value: number;
  meta: string;
};

export type RecentActivityItem = {
  id: string;
  title: string;
  subtitle: string;
  timeLabel: string;
  status: "success" | "warning" | "neutral";
};

export type AlertItem = {
  id: string;
  title: string;
  description: string;
  tone: MetricTone;
};

export type DashboardStats = {
  source: DataSource;
  generatedAt: string;
  headline: string;
  subheadline: string;
  metrics: StatsMetric[];
  activity: {
    title: string;
    points: ActivityPoint[];
  };
  infractions: {
    title: string;
    items: DistributionItem[];
  };
  hotspots: {
    title: string;
    items: RankingItem[];
  };
  agents: {
    title: string;
    items: RankingItem[];
  };
  recentActivity: RecentActivityItem[];
  alerts: AlertItem[];
};

type DashboardStatsApiResponse = {
  success: boolean;
  message: string;
  data: Omit<DashboardStats, "source">;
};

export async function fetchDashboardStats() {
  const response = await api.get<DashboardStatsApiResponse>("stats/dashboard/");
  return response.data.data;
}
