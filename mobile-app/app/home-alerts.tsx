import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import Screen from "../components/screen";
import { AppTheme } from "../constants/theme";
import { fetchHomeAlerts, HomeAlertHistoryItem } from "../src/api/home.api";
import { useAppTheme } from "../src/providers/theme.provider";
import { createPageStyles } from "../src/ui/page-styles";

export default function HomeAlertsScreen() {
  const { theme } = useAppTheme();
  const pageStyles = useMemo(() => createPageStyles(theme), [theme]);
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [items, setItems] = useState<HomeAlertHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchHomeAlerts(30);
        if (mounted) setItems(data.items || []);
      } catch (err: any) {
        if (mounted) setError(err?.response?.data?.message || "Impossible de charger les alertes.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Screen>
      <ScrollView contentContainerStyle={pageStyles.content}>
        <Text style={pageStyles.title}>Toutes les alertes</Text>
        <Text style={pageStyles.subtitle}>Historique des 30 derniers jours</Text>

        {loading ? <ActivityIndicator color={theme.colors.accent} /> : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {!loading && !error && items.length === 0 ? (
          <Text style={styles.emptyText}>Aucune alerte sur la periode.</Text>
        ) : null}

        {items.map((item) => (
          <View key={item.id} style={pageStyles.card}>
            <Text style={pageStyles.cardTitle}>{item.title}</Text>
            <Text style={styles.meta}>Plaque: {item.plateNumber}</Text>
            <Text style={styles.desc}>{item.desc}</Text>
          </View>
        ))}

        <Pressable style={styles.linkBtn} onPress={() => router.back()}>
          <Text style={styles.linkText}>Retour</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    meta: { color: theme.colors.textMuted, fontWeight: "700", marginTop: 6 },
    desc: { color: theme.colors.textDim, marginTop: 4 },
    emptyText: { color: theme.colors.textMuted, fontWeight: "700" },
    errorText: { color: theme.colors.danger, fontWeight: "700" },
    linkBtn: { alignSelf: "center", padding: 8 },
    linkText: { color: theme.colors.accent, fontWeight: "900" },
  });
}
