import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import Screen from "../../components/screen";
import { theme } from "../../constants/theme";
import { getUserProfile, UserProfile } from "../../src/api/users.api";
import * as SecureStore from "expo-secure-store";

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
  status: "SYNCED" | "PENDING" | "ERROR";
};

export default function HomeDashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    // console.log("HomeDashboard mounted -> fetching profile...");
    let mounted = true;
    (async () => {
      const t = await SecureStore.getItemAsync("access_token");
      try {
        const res = await getUserProfile(); // { message, data }
        if (mounted) setProfile(res?.data ?? null);
      } catch (e) {
        // Si 401: token manquant/expiré -> tu peux rediriger login
        // router.replace("/login");
        if (mounted) setProfile(null);
      } finally {
        if (mounted) setLoadingProfile(false);
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

  const userRole = profile?.role || "AGENT_TERRAIN";
  const sync = useMemo(() => ({ online: true, pendingCount: 2 }), []);
  const stats = useMemo(() => ({ controles: 7, verbalisations: 3 }), []);

  const alerts: AlertItem[] = useMemo(
    () => [
      {
        id: "a1",
        title: "Alerte prioritaire",
        desc: "Véhicule recherché détecté sur un contrôle récent.",
        level: "HIGH",
      },
      {
        id: "a2",
        title: "Documents expirés",
        desc: "Assurance expirée sur 2 véhicules contrôlés aujourd’hui.",
        level: "MEDIUM",
      },
    ],
    [],
  );

  const activity: ActivityItem[] = useMemo(
    () => [
      {
        id: "1",
        title: "Contrôle • AA-12345",
        subtitle: "Aujourd’hui • 10:12",
        status: "SYNCED",
      },
      {
        id: "2",
        title: "Verbalisation • Excès de vitesse",
        subtitle: "Aujourd’hui • 09:40",
        status: "PENDING",
      },
      {
        id: "3",
        title: "Contrôle • BB-90877",
        subtitle: "Hier • 18:05",
        status: "SYNCED",
      },
      {
        id: "4",
        title: "Contrôle • CC-00112",
        subtitle: "Hier • 16:22",
        status: "ERROR",
      },
    ],
    [],
  );

  const roleLabel = useMemo(() => {
    const role = profile?.role || "AGENT_TERRAIN";
    return role === "AGENT_TERRAIN"
      ? "Agent de terrain"
      : role === "AGENT_SAISIE"
      ? "Agent de saisie"
      : "Administrateur";
  }, [profile]);

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

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.hi}>Bonjour, {loadingProfile ? "..." : userName}</Text>
            <Text style={styles.role}>{roleLabel}</Text>
          </View>

          <View style={styles.syncBadge}>
            <Ionicons
              name={
                sync.online ? "cloud-done-outline" : "cloud-offline-outline"
              }
              size={16}
              color={theme.colors.text}
            />
            <Text style={styles.syncText}>
              {sync.online ? "En ligne" : "Hors ligne"}
              {sync.pendingCount > 0
                ? ` • ${sync.pendingCount} en attente`
                : ""}
            </Text>
          </View>
        </View>

        {/* Alerts */}
        <View style={styles.alertCard}>
          <View style={styles.alertHeader}>
            <Text style={styles.alertTitle}>Alertes prioritaires</Text>
            <Pressable onPress={() => router.push("/modal")}>
              <Text style={styles.link}>Tout voir</Text>
            </Pressable>
          </View>

          {alerts.map((a) => (
            <View key={a.id} style={styles.alertRow}>
              <Ionicons
                name={
                  a.level === "HIGH"
                    ? "warning-outline"
                    : "information-circle-outline"
                }
                size={18}
                color={
                  a.level === "HIGH" ? theme.colors.danger : theme.colors.accent
                }
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.alertRowTitle}>{a.title}</Text>
                <Text style={styles.alertRowDesc}>{a.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Quick actions */}
        <View style={styles.grid}>
          <QuickAction
            icon="scan-outline"
            title="Scanner plaque"
            subtitle="OCR + cadrage"
            onPress={() => router.push("/modal")} // TODO: /scan
          />
          <QuickAction
            icon="search-outline"
            title="Recherche"
            subtitle="Manuelle"
            onPress={() => router.push("/modal")} // TODO: /search
          />
          <QuickAction
            icon="time-outline"
            title="Derniers scans"
            subtitle="Historique local"
            onPress={() => router.push("/modal")} // TODO: /history/scans
          />
          <QuickAction
            icon="alert-circle-outline"
            title="Verbaliser"
            subtitle="Créer un PV"
            onPress={() => router.push("/modal")} // TODO: /verbalisation/new
          />
        </View>

        {/* Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Statistiques personnelles</Text>
          <View style={styles.statsRow}>
            <StatBox
              label="Contrôles"
              value={String(stats.controles)}
              icon="clipboard-outline"
            />
            <StatBox
              label="Verbalisations"
              value={String(stats.verbalisations)}
              icon="document-text-outline"
            />
          </View>
        </View>

        {/* Activity */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Activité récente</Text>
          <Pressable onPress={() => router.push("/(tabs)/profile")}>
            <Text style={styles.link}>Profil</Text>
          </Pressable>
        </View>

        {activity.map((item) => (
          <ActivityRow key={item.id} item={item} />
        ))}
      </ScrollView>
    </Screen>
  );
}

function QuickAction({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
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
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.statBox}>
      <Ionicons name={icon} size={18} color="rgba(255,255,255,0.85)" />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const badge =
    item.status === "SYNCED"
      ? { text: "Sync", icon: "checkmark-circle-outline" as const }
      : item.status === "PENDING"
        ? { text: "En attente", icon: "time-outline" as const }
        : { text: "Erreur", icon: "close-circle-outline" as const };

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

const styles = StyleSheet.create({
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
  alertRowTitle: { color: theme.colors.text, fontSize: 13, fontWeight: "800" },
  alertRowDesc: {
    color: theme.colors.textDim,
    fontSize: theme.font.small,
    marginTop: 4,
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
  actionTitle: { color: theme.colors.text, fontSize: 14, fontWeight: "900" },
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
  statValue: { color: theme.colors.text, fontSize: 18, fontWeight: "900" },
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
  rowTitle: { color: theme.colors.text, fontSize: 13, fontWeight: "900" },
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
