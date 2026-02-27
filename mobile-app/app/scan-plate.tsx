import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";

import Screen from "../components/screen";
import { theme } from "../constants/theme";
import { scanPlateWithOcr } from "../src/api/vehicles.api";

type ScanResult = {
  plate_number: string;
  confidence: number;
  vehicle_found: boolean;
  vehicle: Record<string, unknown> | null;
  mode: string;
};

export default function ScanPlateScreen() {
  const [rawText, setRawText] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);

  const canScan = useMemo(() => rawText.trim().length > 3 && !loading, [rawText, loading]);

  async function onScan() {
    if (!canScan) return;

    setLoading(true);
    setErrorMsg(null);
    setResult(null);

    try {
      const response = await scanPlateWithOcr(rawText.trim());
      setResult(response.data);
    } catch (error: any) {
      const backendMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Le scan OCR a échoué.";
      setErrorMsg(String(backendMessage));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Scanner une plaque (OCR)</Text>
        <Text style={styles.subtitle}>
          MVP test: collez le texte OCR brut, puis validez la plaque détectée.
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>Texte OCR brut</Text>
          <TextInput
            value={rawText}
            onChangeText={setRawText}
            placeholder="Ex: Véhicule détecté AB123CD sur axe principal..."
            placeholderTextColor={theme.colors.textDim}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={styles.input}
          />

          <Pressable
            onPress={onScan}
            disabled={!canScan}
            style={({ pressed }) => [
              styles.button,
              !canScan && { opacity: 0.5 },
              pressed && canScan && { opacity: 0.9 },
            ]}
          >
            {loading ? <ActivityIndicator /> : <Text style={styles.buttonText}>Lancer OCR</Text>}
          </Pressable>

          {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}
        </View>

        {result ? (
          <View style={styles.card}>
            <Text style={styles.label}>Résultat</Text>
            <Row label="Plaque détectée" value={result.plate_number} />
            <Row label="Confiance" value={`${Math.round(result.confidence * 100)}%`} />
            <Row label="Véhicule trouvé" value={result.vehicle_found ? "Oui" : "Non"} />
            <Row label="Mode" value={result.mode} />
          </View>
        ) : null}

        <Pressable style={styles.linkBtn} onPress={() => router.back()}>
          <Text style={styles.linkText}>Retour accueil</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.k}>{label}</Text>
      <Text style={styles.v}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    gap: 12,
  },
  title: { color: theme.colors.text, fontSize: 22, fontWeight: "900" },
  subtitle: { color: theme.colors.textDim, marginTop: -4 },
  card: {
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 10,
  },
  label: { color: theme.colors.text, fontSize: 14, fontWeight: "900" },
  input: {
    minHeight: 110,
    borderWidth: 1,
    borderColor: theme.colors.border2,
    borderRadius: theme.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface2,
    fontWeight: "700",
  },
  button: {
    borderRadius: theme.radius.md,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: theme.colors.accentSoft,
    borderWidth: 1,
    borderColor: theme.colors.accentBorder,
  },
  buttonText: { color: theme.colors.text, fontWeight: "900" },
  error: { color: theme.colors.danger, fontWeight: "800" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border2,
    paddingTop: 10,
  },
  k: { color: theme.colors.textMuted, fontWeight: "800" },
  v: { color: theme.colors.text, fontWeight: "900" },
  linkBtn: {
    alignSelf: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  linkText: { color: "rgba(255,215,0,0.9)", fontWeight: "900" },
});
