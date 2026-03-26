import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import Screen from "../../components/screen";
import { AppTheme } from "../../constants/theme";
import { fetchHomeDashboard, HomeDashboardData } from "../../src/api/home.api";
import { getUserProfile, UserProfile } from "../../src/api/users.api";
import { useAppTheme } from "../../src/providers/theme.provider";
import { createPageStyles } from "../../src/ui/page-styles";

type AlertItem = {
  id: string;
  title: string;
  desc: string;
  level: "HIGH" | "MEDIUM";
};

type ActivityItem = {
  id: string;
  title: string;
  subtitle: string;
  status: "SUCCESS" | "WARNING" | "NEUTRAL";
};

export default function HomeDashboard() {
  const { theme } = useAppTheme();
  const pageStyles = useMemo(() => createPageStyles(theme), [theme]);
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [dashboard, setDashboard] = useState<HomeDashboardData | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const [profileResult, dashboardResult] = await Promise.allSettled([
          getUserProfile(),
          fetchHomeDashboard(),
        ]);

        if (!mounted) {
          return;
        }

        if (profileResult.status === "fulfilled") {
          setProfile(profileResult.value?.data ?? null);
        } else {
          setProfile(null);
        }

        if (dashboardResult.status === "fulfilled") {
          setDashboard(dashboardResult.value);
          setDashboardError(null);
        } else {
          setDashboard(null);
          const reason: any = dashboardResult.reason;
          setDashboardError(
            reason?.response?.data?.message ||
              reason?.message ||
              "Impossible de charger le tableau de bord."
          );
        }
      } finally {
        if (mounted) {
          setLoadingProfile(false);
          setLoadingDashboard(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const userName = useMemo(() => {
    if (!profile) return "Agent";
    const first = (profile.first_name || "").trim();
    const last = (profile.last_name || "").trim();
    const full = `${first} ${last}`.trim();
    return full || profile.username || "Agent";
  }, [profile]);

  const roleLabel = useMemo(() => {
    const role = profile?.role || "AGENT_TERRAIN";
    return role === "AGENT_TERRAIN"
      ? "Agent de terrain"
      : role === "AGENT_SAISIE"
        ? "Agent de saisie"
        : "Administrateur";
  }, [profile]);

  const sync = useMemo(
    () => dashboard?.sync || { online: false, pendingCount: 0, lastUpdatedAt: "" },
    [dashboard]
  );

  const stats = useMemo(
    () =>
      dashboard?.stats || {
        primaryLabel: "Controles",
        primaryValue: "--",
        secondaryLabel: "Verbalisations",
        secondaryValue: "--",
      },
    [dashboard]
  );

  const alerts: AlertItem[] = useMemo(() => (dashboard?.alerts || []).slice(0, 2), [dashboard]);

  const activity: ActivityItem[] = useMemo(() => (dashboard?.activity || []).slice(0, 4), [dashboard]);

  return (
    <Screen>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.md,
          paddingTop: theme.spacing.lg,
          paddingBottom: theme.spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={pageStyles.title}>Bonjour, {loadingProfile ? "..." : userName}</Text>
            <Text style={pageStyles.subtitle}>{roleLabel}</Text>
          </View>

          <View style={styles.syncBadge}>
            <Ionicons
              name={sync.online ? "cloud-done-outline" : "cloud-offline-outline"}
              size={16}
              color={theme.colors.text}
            />
            <Text style={styles.syncText}>
              {sync.online ? "En ligne" : "Hors ligne"}
              {typeof sync.pendingCount === "number" && sync.pendingCount > 0
                ? ` • ${sync.pendingCount} en attente`
                : ""}
            </Text>
          </View>
        </View>

        {loadingDashboard ? (
          <View style={styles.infoRow}>
            <ActivityIndicator color={theme.colors.accent} />
            <Text style={styles.infoText}>Chargement du tableau de bord...</Text>
          </View>
        ) : null}

        {!loadingDashboard && dashboardError ? (
          <View style={styles.infoRow}>
            <Ionicons name="alert-circle-outline" size={18} color={theme.colors.danger} />
            <Text style={styles.errorText}>{dashboardError}</Text>
          </View>
        ) : null}

        <View style={pageStyles.card}>
          <View style={pageStyles.cardHeader}>
            <Text style={pageStyles.cardTitle}>Alertes prioritaires</Text>
            <Pressable onPress={() => router.push("/modal")}>
              <Text style={styles.link}>Tout voir</Text>
            </Pressable>
          </View>

          {alerts.length > 0 ? (
            alerts.map((a) => (
              <View key={a.id} style={styles.alertRow}>
                <Ionicons
                  name={a.level === "HIGH" ? "warning-outline" : "information-circle-outline"}
                  size={18}
                  color={a.level === "HIGH" ? theme.colors.danger : theme.colors.accent}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.alertRowTitle}>{a.title}</Text>
                  <Text style={styles.alertRowDesc}>{a.desc}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Aucune alerte prioritaire pour le moment.</Text>
          )}
        </View>

        <View style={styles.grid}>
          <QuickAction
            icon="scan-outline"
            title="Scanner plaque"
            subtitle="Scan OCR live"
            onPress={() => router.push("/scan-plate" as any)}
            theme={theme}
            styles={styles}
          />
          <QuickAction
            icon="search-outline"
            title="Recherche"
            subtitle="Documents backend"
            onPress={() => router.push("/(tabs)/documents")}
            theme={theme}
            styles={styles}
          />
          <QuickAction
            icon="time-outline"
            title="Derniers scans"
            subtitle="Historique a finaliser"
            onPress={() => router.push("/modal")}
            theme={theme}
            styles={styles}
          />
          <QuickAction
            icon="alert-circle-outline"
            title="Verbaliser"
            subtitle="Creer un PV"
            onPress={() => router.push("/modal")}
            theme={theme}
            styles={styles}
          />
        </View>

        <View style={pageStyles.card}>
          <Text style={pageStyles.cardTitle}>Statistiques personnelles</Text>
          <View style={styles.statsRow}>
            <StatBox
              label={stats.primaryLabel}
              value={stats.primaryValue}
              icon="clipboard-outline"
              theme={theme}
              styles={styles}
            />
            <StatBox
              label={stats.secondaryLabel}
              value={stats.secondaryValue}
              icon="document-text-outline"
              theme={theme}
              styles={styles}
            />
          </View>
        </View>

        <View style={pageStyles.cardHeader}>
          <Text style={styles.listTitle}>Activite recente</Text>
          <Pressable onPress={() => router.push("/(tabs)/profile")}>
            <Text style={styles.link}>Profil</Text>
          </Pressable>
        </View>

        {activity.length > 0 ? (
          activity.map((item) => (
            <ActivityRow key={item.id} item={item} styles={styles} theme={theme} />
          ))
        ) : (
          <Text style={styles.emptyText}>Aucune activite recente disponible.</Text>
        )}
      </ScrollView>
    </Screen>
  );
}

function QuickAction({
  icon,
  title,
  subtitle,
  onPress,
  theme,
  styles,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
  theme: AppTheme;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.actionCard, pressed && { opacity: 0.88 }]}
    >
      <View style={styles.actionIcon}>
        <Ionicons name={icon} size={20} color={theme.colors.accent} />
      </View>
      <Text style={styles.actionTitle}>{title}</Text>
      <Text style={styles.actionSubtitle}>{subtitle}</Text>
    </Pressable>
  );
}

function StatBox({
  label,
  value,
  icon,
  theme,
  styles,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  theme: AppTheme;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.statBox}>
      <Ionicons name={icon} size={18} color="rgba(255,255,255,0.85)" />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ActivityRow({
  item,
  styles,
  theme,
}: {
  item: ActivityItem;
  styles: ReturnType<typeof createStyles>;
  theme: AppTheme;
}) {
  const badge =
    item.status === "SUCCESS"
      ? { text: "Valide", icon: "checkmark-circle-outline" as const }
      : item.status === "WARNING"
        ? { text: "A verifier", icon: "warning-outline" as const }
        : { text: "Info", icon: "information-circle-outline" as const };

  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{item.title}</Text>
        <Text style={styles.rowSub}>{item.subtitle}</Text>
      </View>
      <View style={styles.rowBadge}>
        <Ionicons name={badge.icon} size={16} color={theme.colors.text} />
        <Text style={styles.rowBadgeText}>{badge.text}</Text>
      </View>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.lg,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: theme.spacing.md,
    },
    hi: { color: theme.colors.text, fontSize: theme.font.h1, fontWeight: "800" },
    role: {
      color: theme.colors.textMuted,
      marginTop: 4,
      fontSize: theme.font.small,
    },
    syncBadge: {
      flexDirection: "row",
      gap: 6,
      alignItems: "center",
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border2,
    },
    syncText: {
      color: "rgba(255,255,255,0.82)",
      fontSize: theme.font.small,
      fontWeight: "800",
    },
    infoRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: theme.spacing.md,
    },
    infoText: {
      color: theme.colors.textMuted,
      fontSize: theme.font.small,
      fontWeight: "700",
    },
    errorText: {
      color: theme.colors.danger,
      fontSize: theme.font.small,
      fontWeight: "700",
      flex: 1,
    },
    alertCard: {
      borderRadius: theme.radius.lg,
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: theme.spacing.md,
    },
    alertHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    alertTitle: {
      color: theme.colors.text,
      fontSize: theme.font.body,
      fontWeight: "900",
    },
    link: { color: "rgba(255,215,0,0.85)", fontWeight: "900" },
    alertRow: { flexDirection: "row", gap: 10, paddingTop: theme.spacing.md },
    alertRowTitle: { color: theme.colors.text, fontSize: theme.font.body, fontWeight: "800" },
    alertRowDesc: {
      color: theme.colors.textDim,
      fontSize: theme.font.small,
      marginTop: 4,
    },
    emptyText: {
      color: theme.colors.textDim,
      fontSize: theme.font.small,
      marginTop: theme.spacing.sm,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
      marginBottom: theme.spacing.md,
    },
    actionCard: {
      width: "48%",
      borderRadius: theme.radius.lg,
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    actionIcon: {
      width: 34,
      height: 34,
      borderRadius: 12,
      backgroundColor: theme.colors.accentSoft,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 10,
      borderWidth: 1,
      borderColor: theme.colors.accentBorder,
    },
    actionTitle: { color: theme.colors.text, fontSize: theme.font.body, fontWeight: "900" },
    actionSubtitle: {
      color: theme.colors.textDim,
      fontSize: theme.font.small,
      marginTop: 4,
    },
    statsCard: {
      borderRadius: theme.radius.lg,
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: theme.spacing.md,
    },
    statsTitle: {
      color: theme.colors.text,
      fontSize: theme.font.body,
      fontWeight: "900",
      marginBottom: 10,
    },
    statsRow: { flexDirection: "row", gap: 10 },
    statBox: {
      flex: 1,
      borderRadius: theme.radius.md,
      paddingVertical: 12,
      alignItems: "center",
      backgroundColor: theme.colors.surface2,
      borderWidth: 1,
      borderColor: theme.colors.border2,
      gap: 6,
    },
    statValue: { color: theme.colors.text, fontSize: theme.font.h2, fontWeight: "900" },
    statLabel: { color: theme.colors.textDim, fontSize: theme.font.small },
    listHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    },
    listTitle: {
      color: theme.colors.text,
      fontSize: theme.font.body,
      fontWeight: "900",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      padding: theme.spacing.md,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.surface2,
      borderWidth: 1,
      borderColor: theme.colors.border2,
      marginBottom: 10,
    },
    rowTitle: { color: theme.colors.text, fontSize: theme.font.body, fontWeight: "900" },
    rowSub: {
      color: theme.colors.textDim,
      fontSize: theme.font.small,
      marginTop: 4,
    },
    rowBadge: {
      flexDirection: "row",
      gap: 6,
      alignItems: "center",
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border2,
    },
    rowBadgeText: {
      color: "rgba(255,255,255,0.85)",
      fontSize: theme.font.small,
      fontWeight: "900",
    },
  });
}
