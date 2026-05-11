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
  normalizePlateNumberInput,
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

type DisplayField = {
  key: string;
  label: string;
  value: string;
};

type DisplaySection = {
  id: string;
  title: string;
  fields: DisplayField[];
};

const DOCS: {
  type: DocumentType;
  label: string;
  placeholder: string;
}[] = [
  {
    type: "DRIVER_LICENSE",
    label: "Permis",
    placeholder: "Ex: AB-12345-CD",
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
    placeholder: "Ex: AB-12345",
  },
];

function normalizeValue(v: unknown): string {
  if (v === null || v === undefined) return "-";
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
    return String(v);
  }
  return "-";
}

function prettyKey(key: string) {
  return key.replaceAll("_", " ");
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function normalizeDisplayValue(value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "boolean") return value ? "Oui" : "Non";
  if (typeof value === "string") {
    const isoLike = /^\d{4}-\d{2}-\d{2}(T.*)?$/.test(value);
    if (isoLike) {
      const d = new Date(value);
      if (!Number.isNaN(d.getTime())) {
        if (value.includes("T")) {
          return d.toLocaleString("en-US", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          });
        }
        return d.toLocaleDateString("fr-FR");
      }
    }
    return value;
  }
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.length === 0 ? "-" : `${value.length} element(s)`;
  return "-";
}

function toSafeSectionId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "-").toLowerCase();
}

function collectSectionsFromObject(
  sectionId: string,
  sectionTitle: string,
  record: Record<string, unknown>
): DisplaySection[] {
  const sections: DisplaySection[] = [];
  const fields: DisplayField[] = [];

  Object.entries(record).forEach(([key, value]) => {
    if (isPlainObject(value)) {
      sections.push(
        ...collectSectionsFromObject(
          `${sectionId}-${toSafeSectionId(key)}`,
          prettyKey(key),
          value
        )
      );
      return;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        fields.push({
          key,
          label: prettyKey(key),
          value: "-",
        });
        return;
      }

      const allObjects = value.every((item) => isPlainObject(item));
      if (allObjects) {
        value.forEach((item, index) => {
          sections.push(
            ...collectSectionsFromObject(
              `${sectionId}-${toSafeSectionId(key)}-${index + 1}`,
              `${prettyKey(key)} ${index + 1}`,
              item as Record<string, unknown>
            )
          );
        });
        return;
      }

      const listValue = value
        .map((item) => normalizeDisplayValue(item))
        .filter((item) => item !== "-")
        .join(", ");
      fields.push({
        key,
        label: prettyKey(key),
        value: listValue || `${value.length} element(s)`,
      });
      return;
    }

    fields.push({
      key,
      label: prettyKey(key),
      value: normalizeDisplayValue(value),
    });
  });

  if (fields.length > 0) {
    sections.unshift({
      id: sectionId,
      title: sectionTitle,
      fields,
    });
  }

  return sections;
}

function buildGenericSections(data: Record<string, unknown>): DisplaySection[] {
  return collectSectionsFromObject("informations", "Informations", data);
}

function buildDriverLicenseSections(data: DriverLicenseSearchResponse): DisplaySection[] {
  return [
    {
      id: "driver-license",
      title: "Resultat permis",
      fields: [
        { key: "nom", label: "Nom", value: normalizeDisplayValue(data.nom || "-") },
        { key: "dossier", label: "Dossier", value: normalizeDisplayValue(data.dossier) },
        { key: "nif", label: "NIF", value: normalizeDisplayValue(data.nif) },
        { key: "adresse", label: "Adresse", value: normalizeDisplayValue(data.adresse) },
        {
          key: "date_de_naissance",
          label: "Date de naissance",
          value: normalizeDisplayValue(data.date_de_naissance),
        },
        { key: "type", label: "Type", value: normalizeDisplayValue(data.type) },
        { key: "emis_le", label: "Emis le", value: normalizeDisplayValue(data.emis_le) },
        { key: "expire_le", label: "Expire le", value: normalizeDisplayValue(data.expire_le) },
        {
          key: "lieu_emission",
          label: "Lieu d'emission",
          value: normalizeDisplayValue(data.lieu_emission),
        },
        {
          key: "groupe_sanguin",
          label: "Groupe sanguin",
          value: normalizeDisplayValue(data.groupe_sanguin),
        },
        { key: "sexe", label: "Sexe", value: normalizeDisplayValue(data.sexe) },
      ],
    },
  ];
}

function buildResultSections(
  selectedType: DocumentType,
  data: unknown,
  licenseData: DriverLicenseSearchResponse | null
): DisplaySection[] {
  if (!data) return [];
  if (selectedType === "DRIVER_LICENSE" && licenseData) {
    return buildDriverLicenseSections(licenseData);
  }
  if (isPlainObject(data)) {
    return buildGenericSections(data);
  }
  return [
    {
      id: "resultat",
      title: "Resultat",
      fields: [{ key: "value", label: "Valeur", value: normalizeDisplayValue(data) }],
    },
  ];
}

function isExpiredDate(value: string | undefined): boolean {
  if (!value) return false;
  const expiry = new Date(value);
  if (Number.isNaN(expiry.getTime())) return false;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return expiry < today;
}

function formatTicketDate(value: unknown): string {
  if (!value || typeof value !== "string") return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

function formatTicketTime(value: unknown): string {
  if (!value || typeof value !== "string") return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
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
  const [dossierSection, setDossierSection] = useState<VehicleDossierSection>("vehicle");
  const [vehicleCardSection, setVehicleCardSection] = useState<
    "vehicule" | "assurance" | "proprietaire" | "immatriculation"
  >("vehicule");
  const [openTicketIndex, setOpenTicketIndex] = useState<number | null>(null);
  const [showAllDossierTickets, setShowAllDossierTickets] = useState(false);

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
        const normalizedPlate = normalizePlateNumberInput(value);
        if (!normalizedPlate) {
          setErrorMsg("Veuillez saisir un numero d'immatriculation valide.");
          return;
        }
        data = await getVehicleDossierByPlate(normalizedPlate, "all");
        effectiveQuery = normalizedPlate;
        setQuery(normalizedPlate);
      }

      setResult(data);
      setOpenTicketIndex(null);
      setShowAllDossierTickets(false);
      setVehicleCardSection("vehicule");
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

  function onLoadDossierSection(section: VehicleDossierSection) {
    setDossierSection(section);
    setOpenTicketIndex(null);
    setShowAllDossierTickets(false);
  }

  const canSearch = query.trim().length > 0 && !loading;
  const isDossierMode = docType === "VEHICLE_REGISTRATION";
  const isDriverLicenseMode = docType === "DRIVER_LICENSE";
  const driverResult = isDriverLicenseMode ? (result as DriverLicenseSearchResponse | null) : null;
  const isLicenseExpired = isExpiredDate(driverResult?.expire_le || undefined);
  const resultSections = useMemo(() => {
    if (isDossierMode || docType === "VEHICLE_CARD") return [];
    return buildResultSections(docType, result, driverResult);
  }, [docType, result, driverResult, isDossierMode]);
  const linkedTickets = Array.isArray(driverResult?.tickets) ? driverResult.tickets : [];
  const linkedTicketsTotal = driverResult?.tickets_summary?.total ?? linkedTickets.length;
  const openTickets = linkedTickets.filter(
    (ticket) => String((ticket as Record<string, unknown>)?.status || "").toUpperCase() === "EN_COURS"
  );

  const dossierData = isDossierMode && isPlainObject(result) ? (result.data as Record<string, unknown> | undefined) : undefined;
  const dossierSectionData =
    dossierSection === "vehicle"
      ? (dossierData?.vehicle as Record<string, unknown> | undefined)
      : dossierSection === "insurance"
      ? (dossierData?.insurance as Record<string, unknown> | undefined)
      : dossierSection === "tickets"
      ? (dossierData?.tickets as Record<string, unknown> | undefined)
      : undefined;
  const dossierAlerts =
    dossierSection === "insurance"
      ? (Array.isArray((dossierSectionData?.alerts as unknown[] | undefined)) ? (dossierSectionData?.alerts as Array<Record<string, unknown>>) : [])
      : dossierSection === "tickets"
      ? (Array.isArray((dossierSectionData?.alerts as unknown[] | undefined)) ? (dossierSectionData?.alerts as Array<Record<string, unknown>>) : [])
      : [];
  const dossierLatestUnpaid =
    dossierSection === "tickets" && Array.isArray(dossierSectionData?.latest_unpaid)
      ? (dossierSectionData?.latest_unpaid as Array<Record<string, unknown>>)
      : [];
  const dossierAllTickets =
    dossierSection === "tickets" && Array.isArray(dossierSectionData?.all_tickets)
      ? (dossierSectionData?.all_tickets as Array<Record<string, unknown>>)
      : [];
  const isVehicleCardMode = docType === "VEHICLE_CARD";
  const vehicleCardData = isVehicleCardMode && isPlainObject(result) ? (result as Record<string, unknown>) : undefined;
  const vehicleCardSectionData = vehicleCardData
    ? ((vehicleCardData[vehicleCardSection] as Record<string, unknown> | null | undefined) ?? undefined)
    : undefined;

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
                  setDossierSection("vehicle");
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

        {isDossierMode ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Afficher une section</Text>
            <View style={styles.chipsRow}>
              {[
                { key: "vehicle", label: "Vehicule" },
                { key: "insurance", label: "Assurance" },
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

        {isVehicleCardMode && vehicleCardData ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Afficher une carte</Text>
            <View style={styles.chipsRow}>
              {[
                { key: "vehicule", label: "Vehicule" },
                { key: "assurance", label: "Assurance" },
                { key: "proprietaire", label: "Proprietaire" },
                { key: "immatriculation", label: "Immatriculation" },
              ].map((item) => {
                const active = vehicleCardSection === (item.key as typeof vehicleCardSection);
                const hasData = Boolean(vehicleCardData[item.key]);
                return (
                  <Pressable
                    key={item.key}
                    onPress={() => setVehicleCardSection(item.key as typeof vehicleCardSection)}
                    style={({ pressed }) => [
                      styles.chip,
                      active && styles.chipActive,
                      !hasData && { opacity: 0.5 },
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

        {isDossierMode && dossierSection === "vehicle" && isPlainObject(dossierSectionData) ? (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Vehicule</Text>
              {isPlainObject(dossierSectionData.vehicule) ? (
                Object.entries(dossierSectionData.vehicule).map(([key, value]) => (
                  <View key={`vehicule-${key}`} style={styles.kvRow}>
                    <Text style={styles.k}>{prettyKey(key)}</Text>
                    <Text style={styles.v}>{normalizeDisplayValue(value)}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.infoText}>Aucune information vehicule.</Text>
              )}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Proprietaire</Text>
              {isPlainObject(dossierSectionData.proprietaire) ? (
                Object.entries(dossierSectionData.proprietaire).map(([key, value]) => (
                  <View key={`proprietaire-${key}`} style={styles.kvRow}>
                    <Text style={styles.k}>{prettyKey(key)}</Text>
                    <Text style={styles.v}>{normalizeDisplayValue(value)}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.infoText}>Aucun proprietaire associe.</Text>
              )}
            </View>
          </>
        ) : null}

        {isDossierMode && dossierSection === "insurance" && isPlainObject(dossierSectionData) ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Assurance</Text>
            {dossierAlerts.map((alert, idx) => (
              <View key={`insurance-alert-${idx}`} style={styles.alertCritical}>
                <Text style={styles.alertCriticalText}>
                  [!] {normalizeDisplayValue(alert.message)}
                </Text>
              </View>
            ))}

            {isPlainObject(dossierSectionData.assurance_en_cours) ? (
              Object.entries(dossierSectionData.assurance_en_cours).map(([key, value]) => (
                <View key={`assurance-${key}`} style={styles.kvRow}>
                  <Text style={styles.k}>{prettyKey(key)}</Text>
                  <Text style={styles.v}>{normalizeDisplayValue(value)}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.infoText}>Aucune assurance en cours trouvee.</Text>
            )}
          </View>
        ) : null}

        {isDossierMode && dossierSection === "tickets" && isPlainObject(dossierSectionData) ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Derniers tickets non payes</Text>
            {dossierAlerts.map((alert, idx) => (
              <View key={`ticket-alert-${idx}`} style={styles.alertCritical}>
                <Text style={styles.alertCriticalText}>
                  [!] {normalizeDisplayValue(alert.message)}
                </Text>
              </View>
            ))}

            {dossierLatestUnpaid.length > 0 ? (
              <View style={styles.ticketListWrap}>
                {dossierLatestUnpaid.map((ticket, index) => (
                  <View key={`latest-unpaid-${index}`} style={styles.ticketItem}>
                    <Text style={styles.v}>Numero: {normalizeValue(ticket.ticket_number)}</Text>
                    <Text style={styles.v}>Statut: {normalizeValue(ticket.status)}</Text>
                    <Text style={styles.v}>Date: {formatTicketDate(ticket.timestamp)}</Text>
                    <Text style={styles.v}>Heure: {formatTicketTime(ticket.timestamp)}</Text>
                    <Text style={styles.v}>Lieu: {normalizeValue(ticket.location)}</Text>
                    <Text style={styles.v}>Motif: {normalizeValue(ticket.motif)}</Text>
                    <Text style={styles.v}>Montant: {normalizeValue(ticket.montant)}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.infoText}>Aucun ticket non paye en cours.</Text>
            )}

            <Pressable
              onPress={() => setShowAllDossierTickets((prev) => !prev)}
              style={({ pressed }) => [styles.alertBtn, pressed && { opacity: 0.9 }]}
            >
              <Text style={styles.alertBtnText}>
                {showAllDossierTickets ? "Masquer tous les tickets" : "Afficher tous les tickets"}
              </Text>
            </Pressable>

            {showAllDossierTickets ? (
              dossierAllTickets.length > 0 ? (
                <View style={styles.ticketListWrap}>
                  {dossierAllTickets.map((ticket, index) => (
                    <View key={`all-ticket-${index}`} style={styles.ticketItem}>
                      <Text style={styles.v}>Numero: {normalizeValue(ticket.ticket_number)}</Text>
                      <Text style={styles.v}>Statut: {normalizeValue(ticket.status)}</Text>
                      <Text style={styles.v}>Date: {formatTicketDate(ticket.timestamp)}</Text>
                      <Text style={styles.v}>Heure: {formatTicketTime(ticket.timestamp)}</Text>
                      <Text style={styles.v}>Lieu: {normalizeValue(ticket.location)}</Text>
                      <Text style={styles.v}>Motif: {normalizeValue(ticket.motif)}</Text>
                      <Text style={styles.v}>Montant: {normalizeValue(ticket.montant)}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.infoText}>Aucun ticket lie a cette immatriculation.</Text>
              )
            ) : null}
          </View>
        ) : null}

        {isVehicleCardMode && vehicleCardData ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {vehicleCardSection.charAt(0).toUpperCase() + vehicleCardSection.slice(1)}
            </Text>
            {vehicleCardSectionData && isPlainObject(vehicleCardSectionData) ? (
              Object.entries(vehicleCardSectionData).map(([key, value]) => (
                <View key={`${vehicleCardSection}-${key}`} style={styles.kvRow}>
                  <Text style={styles.k}>{prettyKey(key)}</Text>
                  <Text style={styles.v}>{normalizeDisplayValue(value)}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.infoText}>Aucune information disponible pour cette carte.</Text>
            )}
          </View>
        ) : null}

        {resultSections.map((section) => (
          <View key={section.id} style={styles.card}>
            <Text style={styles.cardTitle}>{section.title}</Text>
            {isDriverLicenseMode && isLicenseExpired && section.id === "driver-license" ? (
              <View style={styles.alertCritical}>
                <Text style={styles.alertCriticalText}>[!] Permis expire: action requise.</Text>
              </View>
            ) : null}
            {section.fields.map((field) => (
              <View key={`${section.id}-${field.key}`} style={styles.kvRow}>
                <Text style={styles.k}>{field.label}</Text>
                <Text style={styles.v}>{field.value}</Text>
              </View>
            ))}
          </View>
        ))}

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
                          <Text style={styles.v}>Date: {formatTicketDate(record.timestamp)}</Text>
                          <Text style={styles.v}>Heure: {formatTicketTime(record.timestamp)}</Text>
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
    alertCriticalText: { color: theme.colors.link, fontWeight: "900", fontSize: theme.font.small },
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
