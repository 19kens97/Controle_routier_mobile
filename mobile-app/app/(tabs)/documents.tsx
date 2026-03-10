// app/(tabs)/documents.tsx
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

import Screen from "../../components/screen";
import { AppTheme } from "../../constants/theme";
import { useAppTheme } from "../../src/providers/theme.provider";
import {
  DocumentType,
  getVehicleRegistrationByCode,
  searchDriverLicense,
  searchVehicleCard,
  searchVehicleInsurance,
} from "../../src/api/documents.api";

type HistoryItem = {
  type: DocumentType;
  query: string;
  at: number;
};

const DOCS: {
  type: DocumentType;
  label: string;
  placeholder: string;
}[] = [
  {
    type: "DRIVER_LICENSE",
    label: "Permis",
    placeholder: "Ex: DL-2025-000123",
  },
  {
    type: "VEHICLE_CARD",
    label: "Carte véhicule",
    placeholder: "Ex: CV-0007781",
  },
  {
    type: "VEHICLE_INSURANCE",
    label: "Assurance",
    placeholder: "Ex: POL-88991",
  },
  {
    type: "VEHICLE_REGISTRATION",
    label: "Immatriculation",
    placeholder: "Ex: REG-HT-12001",
  },
];

function normalizeValue(v: unknown): string {
  if (v === null || v === undefined) return "-";
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean")
    return String(v);
  // objet/list : on affiche en JSON lisible
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

function prettyKey(key: string) {
  return key.replaceAll("_", " ");
}

export default function DocumentsScreen() {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [docType, setDocType] = useState<DocumentType>("DRIVER_LICENSE");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const meta = useMemo(() => DOCS.find((d) => d.type === docType)!, [docType]);

  async function onSearch(q?: string) {
    const value = (q ?? query).trim();
    if (!value) {
      setErrorMsg("Veuillez saisir un numéro / code.");
      setResult(null);
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setResult(null);

    try {
      let data: any = null;

      if (docType === "DRIVER_LICENSE") {
        data = await searchDriverLicense(value);
      } else if (docType === "VEHICLE_CARD") {
        data = await searchVehicleCard(value);
      } else if (docType === "VEHICLE_INSURANCE") {
        data = await searchVehicleInsurance(value);
      } else if (docType === "VEHICLE_REGISTRATION") {
        data = await getVehicleRegistrationByCode(value);
      }

      setResult(data);
      setHistory((prev) => [{ type: docType, query: value, at: Date.now() }, ...prev].slice(0, 8));
    } catch (e: any) {
      // Axios errors
      const status = e?.response?.status;
      const backendDetail =
        e?.response?.data?.detail ||
        e?.response?.data?.message ||
        e?.response?.data ||
        null;

      if (status === 404) {
        setErrorMsg("Document introuvable.");
      } else if (status === 400) {
        setErrorMsg(
          typeof backendDetail === "string"
            ? backendDetail
            : "Requête invalide."
        );
      } else if (status === 401) {
        setErrorMsg("Session expirée. Veuillez vous reconnecter.");
      } else {
        setErrorMsg(
          typeof backendDetail === "string"
            ? backendDetail
            : "Erreur réseau ou serveur."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  const canSearch = query.trim().length > 0 && !loading;

  return (
    <Screen edges={["top", "left", "right"]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Documents</Text>
        <Text style={styles.subtitle}>
          Rechercher rapidement un document par numéro / code.
        </Text>

        {/* Type selector */}
        <View style={styles.chipsRow}>
          {DOCS.map((d) => {
            const active = d.type === docType;
            return (
              <Pressable
                key={d.type}
                onPress={() => {
                  setDocType(d.type);
                  setResult(null);
                  setErrorMsg(null);
                }}
                style={({ pressed }) => [
                  styles.chip,
                  active && styles.chipActive,
                  pressed && { opacity: 0.9 },
                ]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {d.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Search input */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Numéro / Code</Text>

          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={meta.placeholder}
            placeholderTextColor={theme.colors.textDim}
            autoCapitalize="characters"
            style={styles.input}
            returnKeyType="search"
            onSubmitEditing={() => onSearch()}
          />

          <Pressable
            onPress={() => onSearch()}
            disabled={!canSearch}
            style={({ pressed }) => [
              styles.btn,
              !canSearch && { opacity: 0.5 },
              pressed && canSearch && { opacity: 0.9 },
            ]}
          >
            {loading ? (
              <ActivityIndicator />
            ) : (
              <Text style={styles.btnText}>Rechercher</Text>
            )}
          </Pressable>

          {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}
        </View>

        {/* Result */}
        {result ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Résultat</Text>

            {Object.entries(result).map(([k, v]) => (
              <View key={k} style={styles.kvRow}>
                <Text style={styles.k}>{prettyKey(k)}</Text>
                <Text style={styles.v}>{normalizeValue(v)}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* History */}
        {history.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Historique (session)</Text>
            {history.map((h) => {
              const label = DOCS.find((d) => d.type === h.type)?.label ?? h.type;
              return (
                <Pressable
                  key={`${h.type}-${h.at}`}
                  onPress={() => {
                    setDocType(h.type);
                    setQuery(h.query);
                    onSearch(h.query);
                  }}
                  style={({ pressed }) => [styles.historyRow, pressed && { opacity: 0.9 }]}
                >
                  <Text style={styles.historyLeft}>{label}</Text>
                  <Text style={styles.historyRight}>{h.query}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
  content: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    gap: 12,
  },
  title: { color: theme.colors.text, fontSize: theme.font.h1, fontWeight: "900" },
  subtitle: { color: theme.colors.textDim, marginTop: -6, fontSize: theme.font.small },

  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border2,
  },
  chipActive: {
    backgroundColor: theme.colors.accentSoft,
    borderColor: theme.colors.accentBorder,
  },
  chipText: { color: theme.colors.textDim, fontWeight: "900" },
  chipTextActive: { color: theme.colors.text, fontWeight: "900" },

  card: {
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 10,
  },
  cardTitle: { color: theme.colors.text, fontWeight: "900", fontSize: theme.font.body },

  input: {
    borderWidth: 1,
    borderColor: theme.colors.border2,
    borderRadius: theme.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface2,
    fontWeight: "700",
    fontSize: theme.font.body,
  },

  btn: {
    borderRadius: theme.radius.md,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: theme.colors.accentSoft,
    borderWidth: 1,
    borderColor: theme.colors.accentBorder,
  },
  btnText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.font.body },

  error: { color: theme.colors.danger, fontWeight: "800", fontSize: theme.font.small },

  kvRow: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border2,
    paddingTop: 10,
    gap: 6,
  },
  k: { color: theme.colors.textMuted, fontSize: theme.font.small, fontWeight: "800" },
  v: { color: theme.colors.text, fontSize: theme.font.body, fontWeight: "700" },

  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border2,
  },
  historyLeft: { color: theme.colors.text, fontWeight: "900", fontSize: theme.font.body },
  historyRight: { color: theme.colors.textDim, fontWeight: "800", fontSize: theme.font.body },
  });
}
