import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system/legacy";

import Screen from "../components/screen";
import { AppTheme } from "../constants/theme";
import { API_BASE_URL } from "../src/config/api";
import { useAppTheme } from "../src/providers/theme.provider";
import { createPageStyles } from "../src/ui/page-styles";
import { getApiErrorMessage } from "../src/utils/apiErrors";
import { scanGeminiDirect } from "../src/api/gemini.api";
import {
  getVehicleDossierByPlate,
  normalizePlateNumberInput,
} from "../src/api/documents.api";

type ScanResult = {
  plate: string | null;
  confidence: number;
  candidates: string[];
  raw_text: string;
  is_reliable: boolean;
  source: string;
};

const SEND_RAW_SCAN_IMAGE = true;
const OCR_ENGINE_FOR_SCAN = "gemini-backend";

type OwnerData = {
  nif?: string;
  nom?: string;
  prenom?: string;
  adresse?: string;
  phone?: string;
  email?: string;
};

type VehicleData = {
  plaque?: string;
  marque?: string;
  modele?: string;
  couleur?: string;
  annee?: number;
};

type InsuranceData = {
  numero_police?: string;
  compagnie?: string;
  date_emission?: string;
  date_expiration?: string;
  est_active?: boolean;
};

type RegistrationData = {
  numero_immatriculation?: string;
  type?: string;
  date_emission?: string;
  date_expiration?: string;
};

type DocumentsResultData = {
  vehicule?: VehicleData | null;
  proprietaire?: OwnerData | null;
  assurance?: InsuranceData | null;
  immatriculation?: RegistrationData | null;
};

function formatDate(value: unknown): string {
  if (!value || typeof value !== "string") return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const hasTime = value.includes("T");
  if (hasTime) {
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

export default function ScanPlateScreen() {
  const { theme } = useAppTheme();
  const pageStyles = useMemo(() => createPageStyles(theme), [theme]);
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [plateQuery, setPlateQuery] = useState("");
  const [documentLookupError, setDocumentLookupError] = useState<string | null>(null);
  const [documentLoading, setDocumentLoading] = useState(false);
  const [modelUsed, setModelUsed] = useState<string | null>(null);
  const [documentsResult, setDocumentsResult] = useState<DocumentsResultData | null>(null);
  const [activeSection, setActiveSection] = useState<
    "vehicule" | "proprietaire" | "assurance" | "immatriculation"
  >("vehicule");

  const confidenceLabel = useMemo(() => {
    if (!result) return "";
    return `${Math.round(result.confidence * 100)}%`;
  }, [result]);

  const sourceLabel = useMemo(() => {
    if (!result) return "";

    if (result.source === "focused") return "Crop heuristique";
    if (result.source === "full") return "Image complete";
    if (result.source === "ai") return "Pipeline AI";
    if (result.source === "openalpr") return "OpenALPR";
    if (result.source === "gemini") return "Gemini";
    return result.source;
  }, [result]);

  const promptOpenSettings = () => {
    Alert.alert(
      "Acces camera requis",
      "Pour scanner une plaque, active la camera dans les parametres de l'appareil.",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Ouvrir parametres", onPress: () => Linking.openSettings() },
      ]
    );
  };

  const promptCameraConsent = () =>
    new Promise<"continue" | "settings" | "cancel">((resolve) => {
      Alert.alert(
        "Autorisation camera",
        "Avant de prendre une photo, accepte l'acces a la camera. Tu peux aussi ouvrir les parametres de l'appareil.",
        [
          { text: "Annuler", style: "cancel", onPress: () => resolve("cancel") },
          { text: "Ouvrir parametres", onPress: () => resolve("settings") },
          { text: "Continuer", onPress: () => resolve("continue") },
        ],
        { cancelable: true, onDismiss: () => resolve("cancel") }
      );
    });

  const optimizeImage = async (uri: string) => {
    const manipulated = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1920 } }],
      {
        compress: 0.9,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    return manipulated.uri;
  };

  const validateImageSize = async (uri: string) => {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    
    if (!fileInfo.exists) {
      throw new Error("Image introuvable.");
    }

    const sizeInBytes = fileInfo.size ?? 0;
    const sizeInMb = sizeInBytes / (1024 * 1024);

    if (sizeInMb > 5) {
      throw new Error(
        `Image encore trop volumineuse apres optimisation (${sizeInMb.toFixed(1)} MB). Essaie une photo plus rapprochee ou recadre davantage la plaque.`
      );
    }

    return {
      sizeInBytes,
      sizeInMb,
    };
  };

  const prepareSelectedImage = async (uri: string) => {
    if (SEND_RAW_SCAN_IMAGE) {
      await validateImageSize(uri);
      setImageUri(uri);
    } else {
      const optimizedUri = await optimizeImage(uri);
      await validateImageSize(optimizedUri);
      setImageUri(optimizedUri);
    }
    setResult(null);
    setPlateQuery("");
    setDocumentLookupError(null);
    setModelUsed(null);
    setDocumentsResult(null);
    setActiveSection("vehicule");
  };

  const searchDocumentsFromPlate = async (rawPlate?: string) => {
    const value = normalizePlateNumberInput(rawPlate ?? plateQuery);

    if (!value) {
      setDocumentLookupError("Saisis ou confirme d'abord le numero d'immatriculation.");
      return;
    }

    setDocumentLoading(true);
    setDocumentLookupError(null);
    setDocumentsResult(null);
    setActiveSection("vehicule");

    try {
      const dossier = await getVehicleDossierByPlate(value, "all");
      const allData = (dossier?.data ?? {}) as Record<string, any>;
      setDocumentsResult({
        vehicule: allData?.vehicle?.vehicule ?? null,
        proprietaire: allData?.vehicle?.proprietaire ?? null,
        assurance: allData?.insurance?.assurance_en_cours
          ? {
              numero_police: allData.insurance.assurance_en_cours.policy_number,
              compagnie: allData.insurance.assurance_en_cours.company_name,
              date_emission: allData.insurance.assurance_en_cours.issued_date,
              date_expiration: allData.insurance.assurance_en_cours.expiration_date,
            }
          : null,
        immatriculation: allData?.insurance?.registration
          ? {
              numero_immatriculation: allData.insurance.registration.registration_code,
            }
          : null,
      });
      setPlateQuery(value);
    } catch (lookupErr: any) {
      setDocumentLookupError(
        getApiErrorMessage(lookupErr, {
          notFound: "Aucun vehicule ou document n'a ete trouve pour cette immatriculation.",
          fallback: "Impossible de charger les informations liees a cette immatriculation.",
        })
      );
    } finally {
      setDocumentLoading(false);
    }
  };

  const pickFromLibrary = async () => {
    try {
      setError(null);

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError("Permission galerie refusee.");
        return;
      }

      const selected = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 1,
        allowsEditing: false,
      });

      if (!selected.canceled && selected.assets.length > 0) {
        await prepareSelectedImage(selected.assets[0].uri);
      }
    } catch (err: any) {
      setError(err?.message || "Impossible de preparer l'image selectionnee.");
    }
  };

  const pickFromCamera = async () => {
    try {
      setError(null);

      const consent = await promptCameraConsent();
      if (consent === "cancel") return;
      if (consent === "settings") {
        await Linking.openSettings();
        return;
      }

      const currentPermission = await ImagePicker.getCameraPermissionsAsync();
      let permissionGranted = currentPermission.granted;
      let canAskAgain = currentPermission.canAskAgain;

      if (!permissionGranted && canAskAgain) {
        const requestedPermission = await ImagePicker.requestCameraPermissionsAsync();
        permissionGranted = requestedPermission.granted;
        canAskAgain = requestedPermission.canAskAgain;
      }

      if (!permissionGranted) {
        setError("L'acces a la camera est requis pour prendre une photo de la plaque.");
        promptOpenSettings();
        return;
      }

      const captured = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 1,
        allowsEditing: false,
      });

      if (!captured.canceled && captured.assets.length > 0) {
        await prepareSelectedImage(captured.assets[0].uri);
      }
    } catch (err: any) {
      setError(err?.message || "Impossible de preparer l'image prise par la camera.");
    }
  };

  const runScan = async () => {
    if (!imageUri) {
      setError("Selectionne d'abord une image.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setPlateQuery("");
    setDocumentLookupError(null);
    setModelUsed(null);
    setDocumentsResult(null);
    setActiveSection("vehicule");

    try {
      const response = await scanGeminiDirect(imageUri);
      const raw = response.rawResponse ?? {};
      const plateNumber = (response.plateNumber ?? "").trim().toUpperCase();
      const confidenceRaw = Number(raw?.data?.confidence ?? raw?.confidence ?? (plateNumber ? 1 : 0));
      const confidence = Number.isFinite(confidenceRaw) ? Math.max(0, Math.min(1, confidenceRaw)) : 0;
      const candidates = Array.isArray(raw?.data?.candidates)
        ? raw.data.candidates
        : Array.isArray(raw?.candidates)
          ? raw.candidates
          : plateNumber
            ? [plateNumber]
            : [];
      const model = typeof raw?.model_used === "string" ? raw.model_used : null;
      const documents = (raw?.documents ?? null) as DocumentsResultData | null;

      setModelUsed(model);
      setResult({
        plate: plateNumber || null,
        confidence,
        candidates,
        raw_text: plateNumber,
        is_reliable: Boolean(plateNumber),
        source: "gemini",
      });
      setPlateQuery(plateNumber);
      if (documents) {
        setDocumentsResult(documents);
      }

      if (plateNumber && !documents) {
        await searchDocumentsFromPlate(plateNumber);
      } else if (!plateNumber) {
        setError(
          raw?.message ||
            raw?.detail ||
            "Aucune plaque fiable n'a ete reconnue par Gemini."
        );
      }
    } catch (err: any) {
      setError(
        getApiErrorMessage(err, {
          network: `Connexion au serveur impossible pendant le scan Gemini. Serveur actuel: ${API_BASE_URL}`,
          timeout: "Le scan Gemini a pris trop de temps. Reessaie avec une image plus legere.",
          fallback: "Echec du scan Gemini.",
        })
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={pageStyles.title}>Scanner une plaque</Text>
        <Text style={pageStyles.subtitle}>
          Charge une photo ou prends une image, puis envoie-la au backend Gemini.
        </Text>

        <View style={pageStyles.card}>
          <View style={pageStyles.cardHeader}>
            <Text style={pageStyles.cardTitle}>Scan automatique</Text>
          </View>

          <Text style={styles.helperText}>
            Cadre la plaque et laisse l'application envoyer l'image au flux principal Gemini.
          </Text>
          <Text style={styles.helperText}>Moteur actuel: {OCR_ENGINE_FOR_SCAN.toUpperCase()}</Text>

          <View style={styles.actionRow}>
            <Pressable style={styles.actionBtn} onPress={pickFromLibrary}>
              <Text style={styles.actionBtnText}>Choisir photo</Text>
            </Pressable>

            <Pressable style={styles.actionBtn} onPress={pickFromCamera}>
              <Text style={styles.actionBtnText}>Prendre photo</Text>
            </Pressable>
          </View>

          <View style={styles.previewWrap}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.preview} />
            ) : (
              <View style={styles.previewPlaceholder}>
                <Text style={styles.previewPlaceholderTitle}>Gabarit de plaque</Text>
                <Text style={styles.previewPlaceholderText}>
                  Centre les 2 lettres puis les 5 chiffres dans les cases pour aider le scan.
                </Text>
              </View>
            )}
          </View>

          <Pressable
            style={[pageStyles.primaryButton, loading && { opacity: 0.7 }]}
            onPress={runScan}
            disabled={loading}
          >
            {loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#000" size="small" />
                <Text style={styles.scanBtnText}>Scan en cours...</Text>
              </View>
            ) : (
              <Text style={styles.scanBtnText}>Lancer le scan</Text>
            )}
          </Pressable>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable style={styles.ticketBtn} onPress={() => router.push("/ticket-create")}>
            <Text style={styles.ticketBtnText}>Creer un ticket manuellement</Text>
          </Pressable>

          {result ? (
            <View style={styles.resultBox}>
              <Text style={styles.resultTitle}>Resultat</Text>
              <Text style={styles.value}>Plaque: {result.plate || "Non detectee"}</Text>
              <Text style={styles.value}>Confiance: {confidenceLabel}</Text>
              <Text style={styles.value}>Fiable: {result.is_reliable ? "Oui" : "Non"}</Text>
              <Text style={styles.value}>
                Candidats: {result.candidates.length ? result.candidates.join(", ") : "-"}
              </Text>
              <Text style={styles.value}>Texte brut: {result.raw_text || "-"}</Text>

              <Pressable
                style={styles.ticketBtn}
                onPress={() =>
                  router.push({
                    pathname: "/ticket-create",
                    params: result.plate ? { plate: result.plate } : {},
                  })
                }
              >
                <Text style={styles.ticketBtnText}>
                  {result.plate ? "Creer un ticket avec cette plaque" : "Creer un ticket manuellement"}
                </Text>
              </Pressable>
            </View>
          ) : null}

          {result?.plate ? (
            <View style={styles.resultBox}>
              <Text style={styles.resultTitle}>Recherche complete par immatriculation</Text>
              <Text style={styles.helperText}>
                Confirme la plaque detectee puis charge les documents lies au vehicule.
              </Text>

              <TextInput
                value={plateQuery}
                onChangeText={(value) => {
                  setPlateQuery(value.toUpperCase());
                  if (documentLookupError) {
                    setDocumentLookupError(null);
                  }
                }}
                placeholder="Ex: AB12345 ou AB-12345"
                placeholderTextColor={theme.colors.textDim}
                autoCapitalize="characters"
                style={styles.input}
                returnKeyType="search"
                onSubmitEditing={() => searchDocumentsFromPlate()}
              />

              <Text style={styles.helperText}>
                Le format final est interprete et decoupe cote backend.
              </Text>

              {documentLookupError ? (
                <Text style={styles.errorText}>{documentLookupError}</Text>
              ) : null}
            </View>
          ) : null}

          {documentsResult ? (
            <View style={styles.tabsRow}>
              <Pressable
                style={[styles.tabBtn, activeSection === "vehicule" && styles.tabBtnActive]}
                onPress={() => setActiveSection("vehicule")}
              >
                <Text style={styles.tabBtnText}>Vehicule</Text>
              </Pressable>
              <Pressable
                style={[styles.tabBtn, activeSection === "proprietaire" && styles.tabBtnActive]}
                onPress={() => setActiveSection("proprietaire")}
              >
                <Text style={styles.tabBtnText}>Proprietaire</Text>
              </Pressable>
              <Pressable
                style={[styles.tabBtn, activeSection === "assurance" && styles.tabBtnActive]}
                onPress={() => setActiveSection("assurance")}
              >
                <Text style={styles.tabBtnText}>Assurance</Text>
              </Pressable>
              <Pressable
                style={[styles.tabBtn, activeSection === "immatriculation" && styles.tabBtnActive]}
                onPress={() => setActiveSection("immatriculation")}
              >
                <Text style={styles.tabBtnText}>Immatriculation</Text>
              </Pressable>
            </View>
          ) : null}

          {documentsResult && activeSection === "vehicule" ? (
            <View style={styles.resultBox}>
              <Text style={styles.resultTitle}>Vehicule</Text>
              <Text style={styles.value}>Plaque: {documentsResult.vehicule?.plaque || "-"}</Text>
              <Text style={styles.value}>Marque: {documentsResult.vehicule?.marque || "-"}</Text>
              <Text style={styles.value}>Modele: {documentsResult.vehicule?.modele || "-"}</Text>
              <Text style={styles.value}>Couleur: {documentsResult.vehicule?.couleur || "-"}</Text>
              <Text style={styles.value}>Annee: {documentsResult.vehicule?.annee || "-"}</Text>
            </View>
          ) : null}

          {documentsResult && activeSection === "proprietaire" ? (
            <View style={styles.resultBox}>
              <Text style={styles.resultTitle}>Proprietaire</Text>
              <Text style={styles.value}>NIF: {documentsResult.proprietaire?.nif || "-"}</Text>
              <Text style={styles.value}>Nom: {documentsResult.proprietaire?.nom || "-"}</Text>
              <Text style={styles.value}>Prenom: {documentsResult.proprietaire?.prenom || "-"}</Text>
              <Text style={styles.value}>Adresse: {documentsResult.proprietaire?.adresse || "-"}</Text>
              <Text style={styles.value}>Telephone: {documentsResult.proprietaire?.phone || "-"}</Text>
              <Text style={styles.value}>Email: {documentsResult.proprietaire?.email || "-"}</Text>
            </View>
          ) : null}

          {documentsResult && activeSection === "assurance" ? (
            <View style={styles.resultBox}>
              <Text style={styles.resultTitle}>Assurance</Text>
              <Text style={styles.value}>Numero police: {documentsResult.assurance?.numero_police || "-"}</Text>
              <Text style={styles.value}>Compagnie: {documentsResult.assurance?.compagnie || "-"}</Text>
              <Text style={styles.value}>Date emission: {formatDate(documentsResult.assurance?.date_emission)}</Text>
              <Text style={styles.value}>
                Date expiration: {formatDate(documentsResult.assurance?.date_expiration)}
              </Text>
              <Text style={styles.value}>
                Active: {documentsResult.assurance?.est_active === true ? "Oui" : documentsResult.assurance?.est_active === false ? "Non" : "-"}
              </Text>
            </View>
          ) : null}

          {documentsResult && activeSection === "immatriculation" ? (
            <View style={styles.resultBox}>
              <Text style={styles.resultTitle}>Immatriculation</Text>
              <Text style={styles.value}>
                Numero: {documentsResult.immatriculation?.numero_immatriculation || "-"}
              </Text>
              <Text style={styles.value}>Type: {documentsResult.immatriculation?.type || "-"}</Text>
              <Text style={styles.value}>
                Date emission: {formatDate(documentsResult.immatriculation?.date_emission)}
              </Text>
              <Text style={styles.value}>
                Date expiration: {formatDate(documentsResult.immatriculation?.date_expiration)}
              </Text>
            </View>
          ) : null}
        </View>

        <Pressable style={styles.linkBtn} onPress={() => router.back()}>
          <Text style={styles.linkText}>Retour accueil</Text>
        </Pressable>
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
    helperText: {
      color: theme.colors.textMuted,
      fontSize: theme.font.small,
      fontWeight: "600",
    },
    actionRow: {
      flexDirection: "row",
      gap: 8,
    },
    actionBtn: {
      flex: 1,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border2,
      backgroundColor: theme.colors.surface2,
      paddingVertical: 10,
      alignItems: "center",
    },
    actionBtnText: {
      color: theme.colors.text,
      fontSize: theme.font.small,
      fontWeight: "800",
    },
    preview: {
      width: "100%",
      height: 180,
      borderRadius: theme.radius.md,
    },
    previewWrap: {
      position: "relative",
      width: "100%",
      height: 180,
      borderRadius: theme.radius.md,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: theme.colors.border2,
      backgroundColor: "rgba(255,255,255,0.03)",
    },
    previewPlaceholder: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: theme.spacing.md,
      gap: 8,
    },
    previewPlaceholderTitle: {
      color: theme.colors.text,
      fontSize: theme.font.body,
      fontWeight: "900",
    },
    previewPlaceholderText: {
      color: theme.colors.textMuted,
      fontSize: theme.font.small,
      fontWeight: "700",
      textAlign: "center",
    },
    scanBtnText: {
      color: theme.colors.text,
      fontWeight: "900",
      fontSize: theme.font.body,
    },
    loadingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    value: {
      color: theme.colors.textMuted,
      fontSize: theme.font.body,
      fontWeight: "700",
    },
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
    errorText: {
      color: theme.colors.danger,
      fontSize: theme.font.small,
      fontWeight: "700",
    },
    warningText: {
      color: "rgba(255,215,0,0.9)",
      fontSize: theme.font.small,
      fontWeight: "700",
    },
    tabsRow: {
      flexDirection: "row",
      gap: 8,
    },
    tabBtn: {
      flex: 1,
      borderWidth: 1,
      borderColor: theme.colors.border2,
      borderRadius: theme.radius.md,
      paddingVertical: 8,
      alignItems: "center",
      backgroundColor: theme.colors.surface2,
    },
    tabBtnActive: {
      borderColor: theme.colors.accentBorder,
      backgroundColor: theme.colors.accentSoft,
    },
    tabBtnText: {
      color: theme.colors.text,
      fontSize: theme.font.small,
      fontWeight: "900",
    },
    resultBox: {
      gap: 6,
      borderRadius: theme.radius.md,
      padding: theme.spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.border2,
      backgroundColor: "rgba(255,255,255,0.03)",
    },
    resultTitle: {
      color: theme.colors.text,
      fontSize: theme.font.body,
      fontWeight: "900",
    },
    detailRow: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.border2,
      paddingTop: 8,
      gap: 4,
    },
    detailKey: {
      color: theme.colors.textMuted,
      fontSize: theme.font.small,
      fontWeight: "800",
    },
    docItem: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.border2,
      paddingTop: 10,
      paddingBottom: 6,
      gap: 4,
    },
    docItemLabel: {
      color: theme.colors.textMuted,
      fontSize: theme.font.small,
      fontWeight: "800",
    },
    docItemNumber: {
      color: theme.colors.text,
      fontSize: theme.font.body,
      fontWeight: "900",
    },
    ticketBtn: {
      marginTop: 8,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.accentBorder,
      backgroundColor: theme.colors.accentSoft,
      paddingVertical: 10,
      alignItems: "center",
    },
    ticketBtnText: {
      color: theme.colors.text,
      fontWeight: "900",
      fontSize: theme.font.small,
    },
    linkBtn: {
      alignSelf: "center",
      paddingVertical: 6,
      paddingHorizontal: 8,
    },
    linkText: {
      color: theme.colors.link,
      fontWeight: "900",
      fontSize: theme.font.body,
    },
  });
}
