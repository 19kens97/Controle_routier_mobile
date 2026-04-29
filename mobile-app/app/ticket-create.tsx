import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as Location from "expo-location";

import Screen from "../components/screen";
import { AppTheme } from "../constants/theme";
import { searchDriverLicense } from "../src/api/documents.api";
import { fetchInfractions, InfractionItem } from "../src/api/infractions.api";
import { createManualTicket, createTicketFromPlate } from "../src/api/tickets.api";
import { useAppTheme } from "../src/providers/theme.provider";
import { createPageStyles } from "../src/ui/page-styles";
import { getApiErrorMessage } from "../src/utils/apiErrors";

type TicketReceipt = {
  ticket_number: string;
  timestamp: string;
  location: string;
  status: string;
  agent_name: string;
  plate_number: string;
  motif: string;
  amount: string;
  article?: string;
  infraction_code?: string;
  chauffeur_nom?: string;
  no_permis?: string | null;
};

export default function TicketCreateScreen() {
  const { theme } = useAppTheme();
  const pageStyles = useMemo(() => createPageStyles(theme), [theme]);
  const styles = useMemo(() => createStyles(theme), [theme]);
  const params = useLocalSearchParams<{ plate?: string }>();
  const scannedPlate = typeof params.plate === "string" ? params.plate : "";
  const isScanFlow = Boolean(scannedPlate);

  const [loadingPosition, setLoadingPosition] = useState(true);
  const [loadingInfractions, setLoadingInfractions] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infractions, setInfractions] = useState<InfractionItem[]>([]);
  const [manualPlate, setManualPlate] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [driverName, setDriverName] = useState<string | null>(null);
  const [driverLookupError, setDriverLookupError] = useState<string | null>(null);
  const [searchingDriver, setSearchingDriver] = useState(false);
  const [selectedInfractionId, setSelectedInfractionId] = useState<number | null>(null);
  const [isInfractionDropdownOpen, setIsInfractionDropdownOpen] = useState(false);
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [receipt, setReceipt] = useState<TicketReceipt | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (!permission.granted) return;
        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (!mounted) return;
        setLatitude(current.coords.latitude);
        setLongitude(current.coords.longitude);
      } catch {
        // Optional geolocation.
      } finally {
        if (mounted) setLoadingPosition(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const result = await fetchInfractions();
        if (!mounted) return;
        setInfractions(result);
        if (result.length > 0) {
          setSelectedInfractionId(result[0].id);
        }
      } catch {
        if (mounted) {
          setInfractions([]);
        }
      } finally {
        if (mounted) {
          setLoadingInfractions(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const normalizedLicense = licenseNumber.trim().toUpperCase();
    if (!normalizedLicense) {
      setDriverName(null);
      setDriverLookupError(null);
      setSearchingDriver(false);
      return;
    }
    if (normalizedLicense.length < 4) {
      setDriverName(null);
      setDriverLookupError(null);
      setSearchingDriver(false);
      return;
    }

    let mounted = true;
    const handle = setTimeout(async () => {
      setSearchingDriver(true);
      setDriverLookupError(null);
      try {
        const data = await searchDriverLicense(normalizedLicense);
        if (!mounted) return;
        setDriverName(data.nom || null);
      } catch (err: any) {
        if (!mounted) return;
        setDriverName(null);
        setDriverLookupError(
          getApiErrorMessage(err, {
            notFound: "Permis introuvable.",
            fallback: "Verification du permis indisponible pour le moment.",
          })
        );
      } finally {
        if (mounted) {
          setSearchingDriver(false);
        }
      }
    }, 400);

    return () => {
      mounted = false;
      clearTimeout(handle);
    };
  }, [licenseNumber]);

  const selectedInfraction = useMemo(
    () => infractions.find((item) => item.id === selectedInfractionId) || null,
    [infractions, selectedInfractionId]
  );

  const onSubmit = async () => {
    if (!selectedInfractionId || (!isScanFlow && !manualPlate.trim())) {
      setError(
        isScanFlow
          ? "Selectionne une infraction avant de continuer."
          : "Immatriculation et infraction sont obligatoires."
      );
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const normalizedLicense = licenseNumber.trim().toUpperCase();
      const payload = {
        infraction_id: selectedInfractionId,
        license_number: normalizedLicense || undefined,
        latitude,
        longitude,
      };

      const response = isScanFlow
        ? await createTicketFromPlate({
            ...payload,
            plate_number: scannedPlate,
          })
        : await createManualTicket({
            ...payload,
            plate_number: manualPlate.trim(),
          });

      const ticket = response.data;
      const fullName = [ticket.agent.first_name, ticket.agent.last_name].filter(Boolean).join(" ").trim();
      setReceipt({
        ticket_number: ticket.ticket_number,
        timestamp: ticket.timestamp,
        location: ticket.location,
        status: ticket.status,
        agent_name: fullName || ticket.agent.username,
        plate_number: ticket.vehicle.plate_number,
        motif: ticket.infraction.description,
        amount: ticket.infraction.penalty,
        article: ticket.infraction.article || "-",
        infraction_code: ticket.infraction.code,
        chauffeur_nom: ticket.chauffeur_nom,
        no_permis: ticket.no_permis,
      });
    } catch (err: any) {
      setError(
        getApiErrorMessage(err, {
          badRequest: "Donnees invalides. Verifie l'immatriculation, l'infraction et le permis (si renseigne).",
          forbidden: "Seuls les agents de terrain peuvent creer des tickets.",
          notFound: "Endpoint tickets indisponible. Verifie que le backend a bien ete redemarre.",
          fallback: "Impossible de creer le ticket pour le moment.",
        })
      );
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setManualPlate("");
    setLicenseNumber("");
    setDriverName(null);
    setDriverLookupError(null);
    setError(null);
    setReceipt(null);
  };

  return (
    <Screen>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={pageStyles.content}>
        <Text style={pageStyles.title}>Nouvelle verbalisation</Text>
        <Text style={pageStyles.subtitle}>
          {isScanFlow
            ? "Creation depuis la plaque scannee."
            : "Mode manuel: saisir immatriculation et selectionner une infraction."}
        </Text>

        {!receipt ? (
          <View style={pageStyles.card}>
            {isScanFlow ? <Text style={styles.metaText}>Plaque detectee: {scannedPlate}</Text> : null}

            {loadingPosition ? (
              <View style={styles.infoRow}>
                <ActivityIndicator color={theme.colors.accent} />
                <Text style={styles.infoText}>Recuperation de la position...</Text>
              </View>
            ) : (
              <Text style={styles.infoText}>
                {latitude !== undefined && longitude !== undefined
                  ? "Position GPS prete pour la verbalisation."
                  : "Position GPS non disponible. Le ticket sera cree sans coordonnees."}
              </Text>
            )}

            {!isScanFlow ? (
              <>
                <Text style={styles.label}>Numero d'immatriculation</Text>
                <TextInput
                  value={manualPlate}
                  onChangeText={(value) => setManualPlate(value.toUpperCase())}
                  style={pageStyles.input}
                  placeholder="Ex: AA-12345"
                  placeholderTextColor={theme.colors.textDim}
                  autoCapitalize="characters"
                />
              </>
            ) : null}

            <Text style={styles.label}>Numero de permis (optionnel)</Text>
            <TextInput
              value={licenseNumber}
              onChangeText={(value) => setLicenseNumber(value.toUpperCase())}
              style={pageStyles.input}
              placeholder="Ex: HT-123456"
              placeholderTextColor={theme.colors.textDim}
              autoCapitalize="characters"
            />
            {searchingDriver ? (
              <View style={styles.infoRow}>
                <ActivityIndicator color={theme.colors.accent} />
                <Text style={styles.infoText}>Verification du permis...</Text>
              </View>
            ) : driverName ? (
              <Text style={styles.infoText}>Chauffeur: {driverName}</Text>
            ) : null}
            {driverLookupError ? <Text style={styles.errorText}>{driverLookupError}</Text> : null}

            <Text style={styles.label}>Infraction</Text>
            {loadingInfractions ? (
              <View style={styles.infoRow}>
                <ActivityIndicator color={theme.colors.accent} />
                <Text style={styles.infoText}>Chargement des infractions...</Text>
              </View>
            ) : infractions.length === 0 ? (
              <Text style={styles.errorText}>Aucune infraction disponible.</Text>
            ) : (
              <View style={styles.infractionDropdownWrap}>
                <Pressable
                  style={styles.infractionDropdownTrigger}
                  onPress={() => setIsInfractionDropdownOpen((prev) => !prev)}
                >
                  <Text style={styles.infractionDropdownText}>
                    {selectedInfraction
                      ? `${selectedInfraction.code} - ${selectedInfraction.description}`
                      : "Selectionner une infraction"}
                  </Text>
                  <Text style={styles.infractionDropdownChevron}>{isInfractionDropdownOpen ? "^" : "v"}</Text>
                </Pressable>

                {isInfractionDropdownOpen ? (
                  <ScrollView style={styles.infractionDropdownMenu} nestedScrollEnabled>
                    {infractions.map((item) => {
                      const selected = item.id === selectedInfractionId;
                      return (
                        <Pressable
                          key={item.id}
                          style={[styles.infractionItem, selected && styles.infractionItemSelected]}
                          onPress={() => {
                            setSelectedInfractionId(item.id);
                            setIsInfractionDropdownOpen(false);
                          }}
                        >
                          <Text style={styles.infractionCode}>{item.code}</Text>
                          <Text style={styles.infractionDescription}>{item.description}</Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                ) : null}
              </View>
            )}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Pressable
              style={[pageStyles.primaryButton, submitting && { opacity: 0.7 }]}
              onPress={onSubmit}
              disabled={submitting || loadingInfractions}
            >
              {submitting ? (
                <View style={styles.infoRow}>
                  <ActivityIndicator color={theme.colors.text} />
                  <Text style={pageStyles.primaryButtonText}>Creation en cours...</Text>
                </View>
              ) : (
                <Text style={pageStyles.primaryButtonText}>Enregistrer la verbalisation</Text>
              )}
            </Pressable>
          </View>
        ) : (
          <View style={pageStyles.card}>
            <Text style={styles.receiptTitle}>Recu de verbalisation</Text>
            <Text style={styles.receiptSectionTitle}>Fiche de verbalisation</Text>
            <Text style={styles.receiptLine}>Numero: {receipt.ticket_number}</Text>
            <Text style={styles.receiptLine}>Date/heure: {formatDateTime(receipt.timestamp)}</Text>
            <Text style={styles.receiptLine}>Agent: {receipt.agent_name}</Text>
            <Text style={styles.receiptLine}>Immatriculation: {receipt.plate_number}</Text>
            <Text style={styles.receiptLine}>Chauffeur: {receipt.chauffeur_nom || "-"}</Text>
            <Text style={styles.receiptLine}>Permis: {receipt.no_permis || "-"}</Text>
            <Text style={styles.receiptLine}>Lieu: {receipt.location}</Text>
            <Text style={styles.receiptLine}>Statut: {receipt.status}</Text>
            <Text style={styles.receiptLine}>Signature (agent): {receipt.agent_name}</Text>

            <View style={styles.receiptDivider} />

            <Text style={styles.receiptSectionTitle}>Fiche infraction</Text>
            <Text style={styles.receiptLine}>Numero d'infraction: {receipt.infraction_code || "-"}</Text>
            <Text style={styles.receiptLine}>Infraction: {receipt.motif}</Text>
            <Text style={styles.receiptLine}>Prix: {receipt.amount} HTG</Text>
            <Text style={styles.receiptLine}>Article associe: {receipt.article || "-"}</Text>

            <Pressable style={pageStyles.secondaryButton} onPress={resetForm}>
              <Text style={pageStyles.secondaryButtonText}>Nouvelle verbalisation</Text>
            </Pressable>
          </View>
        )}

        <Pressable style={styles.linkBtn} onPress={() => router.back()}>
          <Text style={styles.linkText}>Retour</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("fr-FR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    label: {
      color: theme.colors.textMuted,
      fontSize: theme.font.small,
      fontWeight: "700",
      marginTop: 2,
    },
    infoRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    infoText: {
      color: theme.colors.textMuted,
      fontSize: theme.font.small,
      fontWeight: "700",
    },
    metaText: {
      color: theme.colors.textDim,
      fontSize: theme.font.body,
      fontWeight: "800",
    },
    infractionDropdownWrap: {
      marginTop: 4,
      gap: 8,
    },
    infractionDropdownTrigger: {
      borderWidth: 1,
      borderColor: theme.colors.border2,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.surface2,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.sm,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 8,
    },
    infractionDropdownText: {
      color: theme.colors.text,
      fontSize: theme.font.body,
      fontWeight: "700",
      flex: 1,
    },
    infractionDropdownChevron: {
      color: theme.colors.textMuted,
      fontSize: theme.font.small,
      fontWeight: "900",
    },
    infractionDropdownMenu: {
      maxHeight: 220,
    },
    infractionItem: {
      borderWidth: 1,
      borderColor: theme.colors.border2,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.surface2,
      padding: theme.spacing.sm,
      gap: 4,
    },
    infractionItemSelected: {
      borderColor: theme.colors.accent,
      backgroundColor: theme.colors.accentSoft,
    },
    infractionCode: {
      color: theme.colors.text,
      fontSize: theme.font.small,
      fontWeight: "900",
    },
    infractionDescription: {
      color: theme.colors.textMuted,
      fontSize: theme.font.body,
      fontWeight: "700",
    },
    infractionPenalty: {
      color: theme.colors.text,
      fontSize: theme.font.small,
      fontWeight: "900",
    },
    errorText: {
      color: theme.colors.danger,
      fontSize: theme.font.small,
      fontWeight: "700",
    },
    receiptTitle: {
      color: theme.colors.text,
      fontSize: theme.font.body,
      fontWeight: "900",
      marginBottom: 6,
    },
    receiptLine: {
      color: theme.colors.textMuted,
      fontSize: theme.font.body,
      fontWeight: "700",
    },
    receiptSectionTitle: {
      color: theme.colors.text,
      fontSize: theme.font.body,
      fontWeight: "900",
      marginTop: 4,
      marginBottom: 4,
    },
    receiptDivider: {
      height: 1,
      backgroundColor: theme.colors.border2,
      marginVertical: 8,
    },
    linkBtn: {
      alignSelf: "center",
      paddingVertical: 6,
      paddingHorizontal: 8,
    },
    linkText: {
      color: "rgba(255,215,0,0.9)",
      fontWeight: "900",
      fontSize: theme.font.body,
    },
  });
}
