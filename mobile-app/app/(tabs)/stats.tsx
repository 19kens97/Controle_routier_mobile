import React, { useEffect, useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import Screen from "../../components/screen";
import { AppTheme } from "../../constants/theme";
import {
  AlertItem,
  DashboardStats,
  DistributionItem,
  RankingItem,
  RecentActivityItem,
  StatsMetric,
  fetchDashboardStats,
} from "../../src/api/stats.api";
import { mockDashboardStats } from "../../src/mocks/stats.mock";
import { useAppTheme } from "../../src/providers/theme.provider";
import { createPageStyles } from "../../src/ui/page-styles";

function withLiveSource(data: Omit<DashboardStats, "source">): DashboardStats {
  return {
    ...data,
    source: "live",
  };
}

export default function StatsScreen() {
  const { theme } = useAppTheme();
  const pageStyles = useMemo(() => createPageStyles(theme), [theme]);
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [dashboard, setDashboard] = useState<DashboardStats>(mockDashboardStats);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadDashboard();
  }, []);

  async function loadDashboard(isRefresh = false) {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await fetchDashboardStats();
      setDashboard(withLiveSource(response));
      setError(null);
    } catch (err: any) {
      setDashboard(mockDashboardStats);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Impossible de charger les statistiques en direct."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const sourceLabel = dashboard.source === "live" ? "Source live" : "Mode demonstration";
  const generatedAtLabel = formatGeneratedAt(dashboard.generatedAt);
  const safeSubheadline = getSafeSubheadline(dashboard.subheadline);

  return (
    <Screen>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={pageStyles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadDashboard(true)}
            tintColor={theme.colors.accent}
          />
        }
      >
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.heroCopy}>
              <Text style={pageStyles.title}>Statistiques</Text>
              <Text style={pageStyles.subtitle}>
                Tableau de bord mobile pret pour les donnees reelles du backend.
              </Text>
            </View>

            <View
              style={[
                styles.sourcePill,
                dashboard.source === "live" ? styles.sourcePillLive : styles.sourcePillMock,
              ]}
            >
              <View
                style={[
                  styles.sourceDot,
                  { backgroundColor: dashboard.source === "live" ? theme.colors.success : theme.colors.accent },
                ]}
              />
              <Text style={styles.sourcePillText}>{sourceLabel}</Text>
            </View>
          </View>

          <Text style={styles.heroHeadline}>{dashboard.headline}</Text>
          <Text style={styles.heroSubheadline}>{safeSubheadline}</Text>

          <View style={styles.heroFooter}>
            <View style={styles.heroMeta}>
              <Ionicons name="time-outline" size={14} color={theme.colors.textMuted} />
              <Text style={styles.heroMetaText}>Mise a jour {generatedAtLabel}</Text>
            </View>

            <Pressable style={styles.refreshButton} onPress={() => void loadDashboard(true)}>
              <Ionicons name="refresh-outline" size={16} color={theme.colors.text} />
              <Text style={styles.refreshButtonText}>Actualiser</Text>
            </Pressable>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={theme.colors.accent} />
            <Text style={styles.loadingText}>Chargement des statistiques...</Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorBanner}>
            <Ionicons name="warning-outline" size={18} color={theme.colors.danger} />
            <Text style={styles.errorText}>
              {error} {dashboard.source === "mock" ? "Affichage du jeu de donnees local." : ""}
            </Text>
          </View>
        ) : null}

        <View style={styles.metricsGrid}>
          {dashboard.metrics.map((metric) => (
            <MetricCard key={metric.id} metric={metric} theme={theme} styles={styles} />
          ))}
        </View>

        <View style={pageStyles.card}>
          <View style={pageStyles.cardHeader}>
            <Text style={pageStyles.cardTitle}>{dashboard.activity.title}</Text>
            <Ionicons name="stats-chart-outline" size={20} color={theme.colors.text} />
          </View>
          <Text style={styles.sectionHint}>Vision glissante sur 7 jours pour suivre le volume terrain.</Text>
          <ActivityChart points={dashboard.activity.points} theme={theme} styles={styles} />
        </View>

        <View style={styles.splitRow}>
          <View style={[pageStyles.card, styles.halfCard]}>
            <View style={pageStyles.cardHeader}>
              <Text style={pageStyles.cardTitle}>{dashboard.infractions.title}</Text>
              <Ionicons name="pie-chart-outline" size={20} color={theme.colors.text} />
            </View>
            <DistributionList items={dashboard.infractions.items} theme={theme} styles={styles} />
          </View>

          <View style={[pageStyles.card, styles.halfCard]}>
            <View style={pageStyles.cardHeader}>
              <Text style={pageStyles.cardTitle}>{dashboard.hotspots.title}</Text>
              <Ionicons name="location-outline" size={20} color={theme.colors.text} />
            </View>
            <RankingList items={dashboard.hotspots.items} styles={styles} />
          </View>
        </View>

        <View style={styles.splitRow}>
          <View style={[pageStyles.card, styles.halfCard]}>
            <View style={pageStyles.cardHeader}>
              <Text style={pageStyles.cardTitle}>Activite recente</Text>
              <Ionicons name="time-outline" size={20} color={theme.colors.text} />
            </View>
            <RecentActivityList items={dashboard.recentActivity} theme={theme} styles={styles} />
          </View>

          <View style={[pageStyles.card, styles.halfCard]}>
            <View style={pageStyles.cardHeader}>
              <Text style={pageStyles.cardTitle}>Alertes et signaux</Text>
              <Ionicons name="flash-outline" size={20} color={theme.colors.text} />
            </View>
            <AlertsList items={dashboard.alerts} styles={styles} />
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

function MetricCard({
  metric,
  theme,
  styles,
}: {
  metric: StatsMetric;
  theme: AppTheme;
  styles: ReturnType<typeof createStyles>;
}) {
  const toneStyle =
    metric.tone === "danger"
      ? styles.metricDanger
      : metric.tone === "warning"
        ? styles.metricWarning
        : metric.tone === "success"
          ? styles.metricSuccess
          : styles.metricDefault;

  const iconName =
    metric.direction === "up"
      ? "arrow-up-outline"
      : metric.direction === "down"
        ? "arrow-down-outline"
        : "remove-outline";

  return (
    <View style={[styles.metricCard, toneStyle]}>
      <Text style={styles.metricLabel}>{metric.label}</Text>
      <Text style={styles.metricValue}>{metric.formattedValue}</Text>
      <View style={styles.metricTrendRow}>
        <Ionicons name={iconName} size={14} color={theme.colors.textMuted} />
        <Text style={styles.metricTrendText}>{metric.deltaLabel}</Text>
      </View>
    </View>
  );
}

function ActivityChart({
  points,
  theme,
  styles,
}: {
  points: DashboardStats["activity"]["points"];
  theme: AppTheme;
  styles: ReturnType<typeof createStyles>;
}) {
  const max = Math.max(...points.map((point) => point.value), 1);

  return (
    <View style={styles.chartWrap}>
      {points.map((point) => (
        <View key={point.label} style={styles.chartColumn}>
          <Text style={styles.chartValue}>{point.value}</Text>
          <View style={styles.chartTrack}>
            <View
              style={[
                styles.chartBar,
                {
                  height: `${Math.max((point.value / max) * 100, 10)}%`,
                  backgroundColor: theme.colors.accent,
                },
              ]}
            />
          </View>
          <Text style={styles.chartLabel}>{point.label}</Text>
        </View>
      ))}
    </View>
  );
}

function DistributionList({
  items,
  theme,
  styles,
}: {
  items: DistributionItem[];
  theme: AppTheme;
  styles: ReturnType<typeof createStyles>;
}) {
  if (!items.length) {
    return <Text style={styles.emptyText}>Aucune donnee disponible pour cette periode.</Text>;
  }

  const total = items.reduce((sum, item) => sum + item.value, 0) || 1;

  return (
    <View style={styles.stack}>
      {items.map((item) => {
        const ratio = Math.max(item.value / total, 0.08);
        return (
          <View key={item.label} style={styles.distRow}>
            <View style={styles.distHeader}>
              <View style={styles.distTitleRow}>
                <View style={[styles.distDot, { backgroundColor: item.color || theme.colors.accent }]} />
                <Text style={styles.distLabel}>{item.label}</Text>
              </View>
              <Text style={styles.distValue}>{item.formattedValue}</Text>
            </View>
            <View style={styles.distTrack}>
              <View
                style={[
                  styles.distBar,
                  {
                    width: `${ratio * 100}%`,
                    backgroundColor: item.color || theme.colors.accent,
                  },
                ]}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

function RankingList({
  items,
  styles,
}: {
  items: RankingItem[];
  styles: ReturnType<typeof createStyles>;
}) {
  if (!items.length) {
    return <Text style={styles.emptyText}>Aucune activite enregistree pour le moment.</Text>;
  }

  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <View style={styles.stack}>
      {items.map((item, index) => (
        <View key={item.id} style={styles.rankRow}>
          <View style={styles.rankIndex}>
            <Text style={styles.rankIndexText}>{index + 1}</Text>
          </View>
          <View style={styles.rankCopy}>
            <Text style={styles.rankLabel}>{item.label}</Text>
            <Text style={styles.rankMeta}>{item.meta}</Text>
          </View>
          <View style={styles.rankValueWrap}>
            <Text style={styles.rankValue}>{item.value}</Text>
            <View style={styles.rankMiniTrack}>
              <View style={[styles.rankMiniBar, { width: `${(item.value / max) * 100}%` }]} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

function RecentActivityList({
  items,
  theme,
  styles,
}: {
  items: RecentActivityItem[];
  theme: AppTheme;
  styles: ReturnType<typeof createStyles>;
}) {
  if (!items.length) {
    return <Text style={styles.emptyText}>Aucun evenement recent a afficher.</Text>;
  }

  return (
    <View style={styles.stack}>
      {items.map((item) => (
        <View key={item.id} style={styles.recentRow}>
          <View
            style={[
              styles.recentStatus,
              {
                backgroundColor:
                  item.status === "success"
                    ? theme.colors.success
                    : item.status === "warning"
                      ? theme.colors.danger
                      : theme.colors.textDim,
              },
            ]}
          />
          <View style={styles.recentCopy}>
            <Text style={styles.recentTitle}>{item.title}</Text>
            <Text style={styles.recentSubtitle}>{item.subtitle}</Text>
          </View>
          <Text style={styles.recentTime}>{item.timeLabel}</Text>
        </View>
      ))}
    </View>
  );
}

function AlertsList({
  items,
  styles,
}: {
  items: AlertItem[];
  styles: ReturnType<typeof createStyles>;
}) {
  if (!items.length) {
    return <Text style={styles.emptyText}>Aucune alerte prioritaire.</Text>;
  }

  return (
    <View style={styles.stack}>
      {items.map((item) => (
        <View
          key={item.id}
          style={[
            styles.alertCard,
            item.tone === "danger"
              ? styles.alertDanger
              : item.tone === "success"
                ? styles.alertSuccess
                : item.tone === "warning"
                  ? styles.alertWarning
                  : styles.alertDefault,
          ]}
        >
          <Text style={styles.alertTitle}>{item.title}</Text>
          <Text style={styles.alertDescription}>{item.description}</Text>
        </View>
      ))}
    </View>
  );
}

function formatGeneratedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "recente";
  }

  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getSafeSubheadline(subheadline: string) {
  if (/agent/i.test(subheadline)) {
    return "Vue generale des controles, zones suivies et alertes utiles, sans detail individuel des agents.";
  }

  return subheadline;
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    heroCard: {
      borderRadius: theme.radius.xl,
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      gap: 12,
    },
    heroHeader: {
      gap: 10,
    },
    heroCopy: {
      gap: 4,
    },
    sourcePill: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: theme.radius.pill,
      borderWidth: 1,
    },
    sourcePillLive: {
      backgroundColor: "rgba(27,138,90,0.08)",
      borderColor: "rgba(27,138,90,0.22)",
    },
    sourcePillMock: {
      backgroundColor: theme.colors.accentSoft,
      borderColor: theme.colors.accentBorder,
    },
    sourceDot: {
      width: 8,
      height: 8,
      borderRadius: 99,
    },
    sourcePillText: {
      color: theme.colors.text,
      fontSize: theme.font.small,
      fontWeight: "800",
    },
    heroHeadline: {
      color: theme.colors.text,
      fontSize: theme.font.h2,
      fontWeight: "900",
      lineHeight: 24,
    },
    heroSubheadline: {
      color: theme.colors.textMuted,
      fontSize: theme.font.body,
      lineHeight: 20,
      fontWeight: "700",
    },
    heroFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 10,
      flexWrap: "wrap",
    },
    heroMeta: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    heroMetaText: {
      color: theme.colors.textMuted,
      fontSize: theme.font.small,
      fontWeight: "700",
    },
    refreshButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.surface2,
      borderWidth: 1,
      borderColor: theme.colors.border2,
    },
    refreshButtonText: {
      color: theme.colors.text,
      fontSize: theme.font.small,
      fontWeight: "800",
    },
    loadingCard: {
      borderRadius: theme.radius.lg,
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: "center",
      gap: 8,
    },
    loadingText: {
      color: theme.colors.textMuted,
      fontSize: theme.font.body,
      fontWeight: "700",
    },
    errorBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      borderRadius: theme.radius.md,
      padding: theme.spacing.md,
      borderWidth: 1,
      borderColor: "rgba(193,18,31,0.24)",
      backgroundColor: "rgba(193,18,31,0.08)",
    },
    errorText: {
      flex: 1,
      color: theme.colors.text,
      fontSize: theme.font.small,
      lineHeight: 18,
      fontWeight: "700",
    },
    metricsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    metricCard: {
      width: "47%",
      borderRadius: theme.radius.lg,
      padding: theme.spacing.md,
      borderWidth: 1,
      gap: 8,
    },
    metricDefault: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
    },
    metricSuccess: {
      backgroundColor: "rgba(27,138,90,0.09)",
      borderColor: "rgba(27,138,90,0.20)",
    },
    metricWarning: {
      backgroundColor: "rgba(232,93,4,0.08)",
      borderColor: "rgba(232,93,4,0.20)",
    },
    metricDanger: {
      backgroundColor: "rgba(193,18,31,0.08)",
      borderColor: "rgba(193,18,31,0.20)",
    },
    metricLabel: {
      color: theme.colors.textDim,
      fontSize: theme.font.small,
      fontWeight: "800",
      textTransform: "uppercase",
    },
    metricValue: {
      color: theme.colors.text,
      fontSize: 28,
      fontWeight: "900",
    },
    metricTrendRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    metricTrendText: {
      flex: 1,
      color: theme.colors.textMuted,
      fontSize: theme.font.small,
      fontWeight: "700",
      lineHeight: 16,
    },
    sectionHint: {
      color: theme.colors.textMuted,
      fontSize: theme.font.small,
      fontWeight: "700",
      lineHeight: 18,
    },
    chartWrap: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
      gap: 8,
      minHeight: 170,
      paddingTop: 10,
    },
    chartColumn: {
      flex: 1,
      alignItems: "center",
      gap: 8,
    },
    chartValue: {
      color: theme.colors.text,
      fontSize: theme.font.small,
      fontWeight: "800",
    },
    chartTrack: {
      width: "100%",
      height: 110,
      borderRadius: theme.radius.md,
      justifyContent: "flex-end",
      padding: 4,
      backgroundColor: theme.colors.surface2,
      borderWidth: 1,
      borderColor: theme.colors.border2,
    },
    chartBar: {
      width: "100%",
      borderRadius: 10,
      minHeight: 8,
    },
    chartLabel: {
      color: theme.colors.textDim,
      fontSize: theme.font.small,
      fontWeight: "800",
    },
    splitRow: {
      gap: 12,
    },
    halfCard: {
      flex: 1,
    },
    stack: {
      gap: 12,
    },
    distRow: {
      gap: 8,
    },
    distHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 8,
    },
    distTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flex: 1,
    },
    distDot: {
      width: 10,
      height: 10,
      borderRadius: 99,
    },
    distLabel: {
      color: theme.colors.text,
      fontSize: theme.font.body,
      fontWeight: "800",
    },
    distValue: {
      color: theme.colors.textMuted,
      fontSize: theme.font.small,
      fontWeight: "800",
    },
    distTrack: {
      height: 10,
      borderRadius: theme.radius.pill,
      overflow: "hidden",
      backgroundColor: theme.colors.surface2,
      borderWidth: 1,
      borderColor: theme.colors.border2,
    },
    distBar: {
      height: "100%",
      borderRadius: theme.radius.pill,
    },
    rankRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    rankIndex: {
      width: 30,
      height: 30,
      borderRadius: 99,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.surface2,
      borderWidth: 1,
      borderColor: theme.colors.border2,
    },
    rankIndexText: {
      color: theme.colors.text,
      fontSize: theme.font.small,
      fontWeight: "900",
    },
    rankCopy: {
      flex: 1,
      gap: 2,
    },
    rankLabel: {
      color: theme.colors.text,
      fontSize: theme.font.body,
      fontWeight: "800",
    },
    rankMeta: {
      color: theme.colors.textMuted,
      fontSize: theme.font.small,
      fontWeight: "700",
    },
    rankValueWrap: {
      width: 64,
      gap: 6,
      alignItems: "flex-end",
    },
    rankValue: {
      color: theme.colors.text,
      fontSize: theme.font.body,
      fontWeight: "900",
    },
    rankMiniTrack: {
      width: "100%",
      height: 6,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.surface2,
      overflow: "hidden",
    },
    rankMiniBar: {
      height: "100%",
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.accent,
    },
    recentRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
    },
    recentStatus: {
      width: 10,
      height: 10,
      borderRadius: 99,
      marginTop: 4,
    },
    recentCopy: {
      flex: 1,
      gap: 2,
    },
    recentTitle: {
      color: theme.colors.text,
      fontSize: theme.font.body,
      fontWeight: "800",
    },
    recentSubtitle: {
      color: theme.colors.textMuted,
      fontSize: theme.font.small,
      fontWeight: "700",
      lineHeight: 18,
    },
    recentTime: {
      color: theme.colors.textDim,
      fontSize: theme.font.small,
      fontWeight: "700",
    },
    alertCard: {
      gap: 6,
      borderRadius: theme.radius.md,
      padding: theme.spacing.md,
      borderWidth: 1,
    },
    alertDefault: {
      backgroundColor: theme.colors.surface2,
      borderColor: theme.colors.border2,
    },
    alertSuccess: {
      backgroundColor: "rgba(27,138,90,0.09)",
      borderColor: "rgba(27,138,90,0.20)",
    },
    alertWarning: {
      backgroundColor: "rgba(232,93,4,0.08)",
      borderColor: "rgba(232,93,4,0.20)",
    },
    alertDanger: {
      backgroundColor: "rgba(193,18,31,0.08)",
      borderColor: "rgba(193,18,31,0.20)",
    },
    alertTitle: {
      color: theme.colors.text,
      fontSize: theme.font.body,
      fontWeight: "900",
    },
    alertDescription: {
      color: theme.colors.textMuted,
      fontSize: theme.font.small,
      lineHeight: 18,
      fontWeight: "700",
    },
    emptyText: {
      color: theme.colors.textMuted,
      fontSize: theme.font.small,
      fontWeight: "700",
      lineHeight: 18,
    },
  });
}
