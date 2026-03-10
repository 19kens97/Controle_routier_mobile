import React, { useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Text, StyleSheet, View } from "react-native";
import Screen from "../../components/screen";
import { AppTheme } from "../../constants/theme";
import { useAppTheme } from "../../src/providers/theme.provider";
import { createPageStyles } from "../../src/ui/page-styles";

export default function StatsScreen() {
  const { theme } = useAppTheme();
  const pageStyles = useMemo(() => createPageStyles(theme), [theme]);
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Screen>
      <View style={pageStyles.content}>
        <Text style={pageStyles.title}>Statistiques</Text>
        <Text style={pageStyles.subtitle}>
          Vue synthétique des contrôles, alertes et activités récentes.
        </Text>

        <View style={pageStyles.card}>
          <View style={pageStyles.cardHeader}>
            <Text style={pageStyles.cardTitle}>Aperçu</Text>
            <Ionicons name="stats-chart-outline" size={20} color={theme.colors.text} />
          </View>

          <View style={styles.grid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>128</Text>
              <Text style={styles.metricLabel}>Contrôles</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>17</Text>
              <Text style={styles.metricLabel}>Alertes</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>11</Text>
              <Text style={styles.metricLabel}>PV saisis</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>6</Text>
              <Text style={styles.metricLabel}>En attente</Text>
            </View>
          </View>
        </View>

        <View style={pageStyles.card}>
          <View style={pageStyles.cardHeader}>
            <Text style={pageStyles.cardTitle}>Tendance</Text>
            <Ionicons name="pulse-outline" size={20} color={theme.colors.text} />
          </View>
          <Text style={styles.insightText}>
            Activité stable aujourd’hui avec un pic en fin de matinée. Les synchronisations
            en attente restent faibles.
          </Text>
        </View>
      </View>
    </Screen>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    metricCard: {
      width: "47%",
      borderRadius: theme.radius.md,
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface2,
      borderWidth: 1,
      borderColor: theme.colors.border2,
      gap: 4,
    },
    metricValue: {
      color: theme.colors.text,
      fontSize: 22,
      fontWeight: "900",
    },
    metricLabel: {
      color: theme.colors.textDim,
      fontSize: theme.font.small,
      fontWeight: "800",
    },
    insightText: {
      color: theme.colors.textMuted,
      fontSize: 13,
      lineHeight: 20,
      fontWeight: "700",
    },
  });
}
