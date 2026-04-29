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
import { getApiErrorMessage } from "../../src/utils/apiErrors";
import {
  DocumentType,
  DriverLicenseSearchResponse,
  getVehicleDossierByPlate,
  getVehicleRegistrationByCode,
  searchDriverLicense,
  searchVehicleCard,
  searchVehicleInsurance,
  VehicleDossierSection,
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
    label: "Carte vehicule",
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
  {
    type: "VEHICLE_DOSSIER",
    label: "Dossier plaque",
    placeholder: "Ex: AB-12345",
  },
];

function normalizeValue(v: unknown): string {
  if (v === null || v === undefined) return "-";
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
    return String(v);
  }
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

function prettyKey(key: string) {
  return key.replaceAll("_", " ");
}

function normalizePlateNumberInput(value: string): string {
  const raw = value.trim().toUpperCase();
  if (!raw) return "";

  const compact = raw.replace(/[^A-Z0-9]/g, "");
  if (compact.length === 7) {
    return `${compact.slice(0, 2)}-${compact.slice(2)}`;
  }

  return raw;
}

function isExpiredDate(value: string | undefined): boolean {
  if (!value) return false;
  const expiry = new Date(value);
  if (Number.isNaN(expiry.getTime())) return false;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return expiry < today;
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
  const [dossierSection, setDossierSection] = useState<VehicleDossierSection>("all");
  const [openTicketIndex, setOpenTicketIndex] = useState<number | null>(null);

  const meta = useMemo(() => DOCS.find((d) => d.type === docType)!, [docType]);

  async function onSearch(q?: string) {
    const value = (q ?? query).trim();
    if (!value) {
      setErrorMsg("Veuillez saisir un numero ou code.");
      setResult(null);
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setResult(null);

    try {
      let data: any = null;
      let effectiveQuery = value;

      if (docType === "DRIVER_LICENSE") {
        data = await searchDriverLicense(value);
      } else if (docType === "VEHICLE_CARD") {
        data = await searchVehicleCard(value);
      } else if (docType === "VEHICLE_INSURANCE") {
        data = await searchVehicleInsurance(value);
      } else if (docType === "VEHICLE_REGISTRATION") {
        data = await getVehicleRegistrationByCode(value);
      } else if (docType === "VEHICLE_DOSSIER") {
        const normalizedPlate = normalizePlateNumberInput(value);
        if (!normalizedPlate) {
          setErrorMsg("Veuillez saisir un numero d'immatriculation valide.");
          return;
        }
        data = await getVehicleDossierByPlate(normalizedPlate, dossierSection);
        effectiveQuery = normalizedPlate;
        setQuery(normalizedPlate);
      }

      setResult(data);
      setOpenTicketIndex(null);
      setHistory((prev) => [{ type: docType, query: effectiveQuery, at: Date.now() }, ...prev].slice(0, 8));
    } catch (e: any) {
      setErrorMsg(
        getApiErrorMessage(e, {
          notFound: "Document ou vehicule introuvable.",
          fallback: "Impossible de finaliser la recherche pour le moment.",
        })
      );
    } finally {
      setLoading(false);
    }
  }

  async function onLoadDossierSection(section: VehicleDossierSection) {
    const normalizedPlate = normalizePlateNumberInput(query);
    if (!normalizedPlate) {
      setErrorMsg("Veuillez saisir un numero d'immatriculation valide.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const data = await getVehicleDossierByPlate(normalizedPlate, section);
      setResult(data);
      setOpenTicketIndex(null);
      setDossierSection(section);
      setQuery(normalizedPlate);
    } catch (e: any) {
      setErrorMsg(
        getApiErrorMessage(e, {
          notFound: "Aucun dossier trouve pour cette immatriculation.",
          fallback: "Impossible de charger cette section du dossier.",
        })
      );
    } finally {
      setLoading(false);
    }
  }

  const canSearch = query.trim().length > 0 && !loading;
  const isDossierMode = docType === "VEHICLE_DOSSIER";
  const isDriverLicenseMode = docType === "DRIVER_LICENSE";
  const driverResult = isDriverLicenseMode ? (result as DriverLicenseSearchResponse | null) : null;
  const isLicenseExpired = isExpiredDate(driverResult?.expire_le || undefined);
  const linkedTickets = Array.isArray(driverResult?.tickets) ? driverResult.tickets : [];
  const linkedTicketsTotal = driverResult?.tickets_summary?.total ?? linkedTickets.length;
  const openTickets = linkedTickets.filter(
    (ticket) => String((ticket as Record<string, unknown>)?.status || "").toUpperCase() === "EN_COURS"
  );

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
          Recherche rapide par numero, code, ou plaque d'immatriculation.
        </Text>

        <View style={styles.chipsRow}>
          {DOCS.map((d) => {
            const active = d.type === docType;
            return (
              <Pressable
                key={d.type}
                onPress={() => {
                  setDocType(d.type);
                  setDossierSection("all");
                  setResult(null);
                  setErrorMsg(null);
                }}
                style={({ pressed }) => [
                  styles.chip,
                  active && styles.chipActive,
                  pressed && { opacity: 0.9 },
                ]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{d.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {isDossierMode ? "Numero d'immatriculation" : "Numero / Code"}
          </Text>

          <TextInput
            value={query}
            onChangeText={(v) => setQuery(isDossierMode ? v.toUpperCase() : v)}
            placeholder={meta.placeholder}
            placeholderTextColor={theme.colors.textDim}
            autoCapitalize={isDossierMode ? "characters" : "none"}
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
              <View style={styles.btnLoadingRow}>
                <ActivityIndicator />
                <Text style={styles.btnText}>Recherche...</Text>
              </View>
            ) : (
              <Text style={styles.btnText}>Rechercher</Text>
            )}
          </Pressable>

          {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}
        </View>

        {isDossierMode && result?.overview ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Resume rapide</Text>

            <View style={styles.kvRow}>
              <Text style={styles.k}>plaque</Text>
              <Text style={styles.v}>{normalizeValue(result?.overview?.plate_number)}</Text>
            </View>
            <View style={styles.kvRow}>
              <Text style={styles.k}>vehicule</Text>
              <Text style={styles.v}>{normalizeValue(result?.overview?.vehicule)}</Text>
            </View>
            <View style={styles.kvRow}>
              <Text style={styles.k}>documents ok</Text>
              <Text style={styles.v}>{normalizeValue(result?.overview?.documents_ok)}</Text>
            </View>
            <View style={styles.kvRow}>
              <Text style={styles.k}>tickets en cours</Text>
              <Text style={styles.v}>{normalizeValue(result?.overview?.tickets_en_cours)}</Text>
            </View>
            <View style={styles.kvRow}>
              <Text style={styles.k}>tickets regles</Text>
              <Text style={styles.v}>{normalizeValue(result?.overview?.tickets_regles)}</Text>
            </View>

            <Text style={styles.cardTitle}>Afficher une section</Text>
            <View style={styles.chipsRow}>
              {[
                { key: "all", label: "Tout" },
                { key: "vehicle", label: "Vehicule" },
                { key: "documents", label: "Papiers" },
                { key: "tickets", label: "Tickets" },
              ].map((item) => {
                const active = dossierSection === (item.key as VehicleDossierSection);
                return (
                  <Pressable
                    key={item.key}
                    onPress={() => onLoadDossierSection(item.key as VehicleDossierSection)}
                    style={({ pressed }) => [
                      styles.chip,
                      active && styles.chipActive,
                      pressed && { opacity: 0.9 },
                    ]}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {driverResult ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Resultat permis</Text>

            {isLicenseExpired ? (
              <View style={styles.alertCritical}>
                <Text style={styles.alertCriticalText}>[!] Permis expire: action requise.</Text>
              </View>
            ) : null}

            <View style={styles.kvRow}>
              <Text style={styles.k}>Nom</Text>
              <Text style={styles.v}>{normalizeValue(driverResult.nom || "-")}</Text>
            </View>
            <View style={styles.kvRow}>
              <Text style={styles.k}>Dossier</Text>
              <Text style={styles.v}>{normalizeValue(driverResult.dossier)}</Text>
            </View>
            <View style={styles.kvRow}>
              <Text style={styles.k}>NIF</Text>
              <Text style={styles.v}>{normalizeValue(driverResult.nif)}</Text>
            </View>
            <View style={styles.kvRow}>
              <Text style={styles.k}>Adresse</Text>
              <Text style={styles.v}>{normalizeValue(driverResult.adresse)}</Text>
            </View>
            <View style={styles.kvRow}>
              <Text style={styles.k}>Date de naissance</Text>
              <Text style={styles.v}>{normalizeValue(driverResult.date_de_naissance)}</Text>
            </View>
            <View style={styles.kvRow}>
              <Text style={styles.k}>Type</Text>
              <Text style={styles.v}>{normalizeValue(driverResult.type)}</Text>
            </View>
            <View style={styles.kvRow}>
              <Text style={styles.k}>Emis le</Text>
              <Text style={styles.v}>{normalizeValue(driverResult.emis_le)}</Text>
            </View>
            <View style={styles.kvRow}>
              <Text style={styles.k}>Expire le</Text>
              <Text style={styles.v}>{normalizeValue(driverResult.expire_le)}</Text>
            </View>
            <View style={styles.kvRow}>
              <Text style={styles.k}>Lieu d'emission</Text>
              <Text style={styles.v}>{normalizeValue(driverResult.lieu_emission)}</Text>
            </View>
            <View style={styles.kvRow}>
              <Text style={styles.k}>Groupe sanguin</Text>
              <Text style={styles.v}>{normalizeValue(driverResult.groupe_sanguin)}</Text>
            </View>
            <View style={styles.kvRow}>
              <Text style={styles.k}>Sexe</Text>
              <Text style={styles.v}>{normalizeValue(driverResult.sexe)}</Text>
            </View>
          </View>
        ) : null}

        {driverResult ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Tickets lies</Text>
            <View style={styles.kvRow}>
              <Text style={styles.k}>total</Text>
              <Text style={styles.v}>{linkedTicketsTotal}</Text>
            </View>

            {openTickets.length > 0 ? (
              <>
                <Pressable
                  onPress={() => setOpenTicketIndex((prev) => (prev === -1 ? null : -1))}
                  style={({ pressed }) => [styles.alertBtn, pressed && { opacity: 0.9 }]}
                >
                  <Text style={styles.alertBtnText}>
                    [!] {openTickets.length} verbalisation(s) en cours - cliquer pour afficher
                  </Text>
                </Pressable>

                {openTicketIndex === -1 ? (
                  <View style={styles.ticketListWrap}>
                    {openTickets.map((ticket, index) => {
                      const record = ticket as Record<string, unknown>;
                      return (
                        <View key={`open-ticket-${index}`} style={styles.ticketItem}>
                          <Text style={styles.v}>Numero: {normalizeValue(record.ticket_number)}</Text>
                          <Text style={styles.v}>Statut: {normalizeValue(record.status)}</Text>
                          <Text style={styles.v}>Date: {normalizeValue(record.timestamp)}</Text>
                          <Text style={styles.v}>Lieu: {normalizeValue(record.location)}</Text>
                          <Text style={styles.v}>
                            Infraction:{" "}
                            {normalizeValue(
                              (record.infraction as Record<string, unknown> | undefined)?.description
                            )}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                ) : null}
              </>
            ) : (
              <Text style={styles.infoText}>Aucune verbalisation en cours.</Text>
            )}
          </View>
        ) : null}

        {result && !driverResult ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Resultat</Text>
            {Object.entries(result).map(([k, v]) => (
              <View key={k} style={styles.kvRow}>
                <Text style={styles.k}>{prettyKey(k)}</Text>
                <Text style={styles.v}>{normalizeValue(v)}</Text>
              </View>
            ))}
          </View>
        ) : null}

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
    btnLoadingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },

    error: { color: theme.colors.danger, fontWeight: "800", fontSize: theme.font.small },
    infoText: { color: theme.colors.textMuted, fontWeight: "700", fontSize: theme.font.small },

    kvRow: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.border2,
      paddingTop: 10,
      gap: 6,
    },
    k: { color: theme.colors.textMuted, fontSize: theme.font.small, fontWeight: "800" },
    v: { color: theme.colors.text, fontSize: theme.font.body, fontWeight: "700" },
    alertBtn: {
      borderRadius: theme.radius.md,
      paddingVertical: 10,
      paddingHorizontal: 10,
      backgroundColor: theme.colors.accentSoft,
      borderWidth: 1,
      borderColor: theme.colors.accentBorder,
    },
    alertBtnText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.font.small },
    alertCritical: {
      borderRadius: theme.radius.md,
      paddingVertical: 10,
      paddingHorizontal: 10,
      backgroundColor: "rgba(220,38,38,0.16)",
      borderWidth: 1,
      borderColor: "rgba(220,38,38,0.55)",
    },
    alertCriticalText: { color: theme.colors.danger, fontWeight: "900", fontSize: theme.font.small },
    ticketListWrap: { gap: 8 },
    ticketItem: {
      borderWidth: 1,
      borderColor: theme.colors.border2,
      borderRadius: theme.radius.md,
      padding: 10,
      gap: 4,
      backgroundColor: theme.colors.surface2,
    },

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
