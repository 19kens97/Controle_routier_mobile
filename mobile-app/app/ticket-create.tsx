import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as Location from "expo-location";

import Screen from "../components/screen";
import { AppTheme } from "../constants/theme";
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
};

export default function TicketCreateScreen() {
  const { theme } = useAppTheme();
  const pageStyles = useMemo(() => createPageStyles(theme), [theme]);
  const styles = useMemo(() => createStyles(theme), [theme]);
  const params = useLocalSearchParams<{ plate?: string }>();
  const scannedPlate = typeof params.plate === "string" ? params.plate : "";
  const isScanFlow = Boolean(scannedPlate);

  const [loadingPosition, setLoadingPosition] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualPlate, setManualPlate] = useState("");
  const [motif, setMotif] = useState("");
  const [amount, setAmount] = useState("");
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

  const onSubmit = async () => {
    if (!motif.trim() || !amount.trim() || (!isScanFlow && !manualPlate.trim())) {
      setError(
        isScanFlow
          ? "Motif et montant sont obligatoires."
          : "Immatriculation, motif et montant sont obligatoires."
      );
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const response = isScanFlow
        ? await createTicketFromPlate({
            plate_number: scannedPlate,
            motif: motif.trim(),
            amount: amount.trim(),
            latitude,
            longitude,
          })
        : await createManualTicket({
            plate_number: manualPlate.trim(),
            motif: motif.trim(),
            amount: amount.trim(),
            latitude,
            longitude,
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
      });
    } catch (err: any) {
      setError(
        getApiErrorMessage(err, {
          badRequest: "Donnees invalides. Verifie l'immatriculation, le motif et le montant.",
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
    setMotif("");
    setAmount("");
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
            : "Mode manuel: saisir immatriculation, motif et montant."}
        </Text>

        {!receipt ? (
          <View style={pageStyles.card}>
            {isScanFlow ? (
              <Text style={styles.metaText}>Plaque detectee: {scannedPlate}</Text>
            ) : null}

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

            <Text style={styles.label}>Motif</Text>
            <TextInput
              value={motif}
              onChangeText={setMotif}
              style={pageStyles.input}
              placeholder="Ex: Feu rouge grille"
              placeholderTextColor={theme.colors.textDim}
            />

            <Text style={styles.label}>Montant (HTG)</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              style={pageStyles.input}
              keyboardType="decimal-pad"
              placeholder="Ex: 1750.00"
              placeholderTextColor={theme.colors.textDim}
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Pressable
              style={[pageStyles.primaryButton, submitting && { opacity: 0.7 }]}
              onPress={onSubmit}
              disabled={submitting}
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
            <Text style={styles.receiptLine}>Numero: {receipt.ticket_number}</Text>
            <Text style={styles.receiptLine}>Date/heure: {formatDateTime(receipt.timestamp)}</Text>
            <Text style={styles.receiptLine}>Agent: {receipt.agent_name}</Text>
            <Text style={styles.receiptLine}>Immatriculation: {receipt.plate_number}</Text>
            <Text style={styles.receiptLine}>Motif: {receipt.motif}</Text>
            <Text style={styles.receiptLine}>Montant: {receipt.amount} HTG</Text>
            <Text style={styles.receiptLine}>Lieu: {receipt.location}</Text>
            <Text style={styles.receiptLine}>Statut: {receipt.status}</Text>

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
