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
import {
  scanVehiclePlate,
  searchVehicleByPlate,
  VehicleLookupData,
} from "../src/api/vehicles.api";
import {
  getVehicleRegistrationByCode,
  searchVehicleCard,
  searchVehicleInsurance,
} from "../src/api/documents.api";

type ScanResult = {
  plate: string | null;
  confidence: number;
  candidates: string[];
  raw_text: string;
  is_reliable: boolean;
  source: string;
};

type DocumentReferenceType = "vehicleCard" | "insurance" | "registration";

type SelectedDocumentState = {
  type: DocumentReferenceType;
  label: string;
  number: string;
  data: any;
};

function normalizeValue(value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function prettyKey(key: string) {
  return key.replaceAll("_", " ");
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
  const [vehicleData, setVehicleData] = useState<VehicleLookupData | null>(null);
  const [vehicleLookupError, setVehicleLookupError] = useState<string | null>(null);
  const [documentLookupError, setDocumentLookupError] = useState<string | null>(null);
  const [documentLoading, setDocumentLoading] = useState(false);
  const [documentDetailsLoading, setDocumentDetailsLoading] = useState(false);
  const [documentDetailsError, setDocumentDetailsError] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<SelectedDocumentState | null>(null);

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
    return result.source;
  }, [result]);

  const documentReferences = useMemo(() => {
    if (!vehicleData) return [];

    const firstCard = vehicleData.vehicle_cards[0]?.card_number;
    const firstInsurance = vehicleData.insurances[0]?.policy_number;
    const registrationCode = vehicleData.registration?.registration_code;

    return [
      {
        type: "vehicleCard" as const,
        label: "Numero carte vehicule",
        number: firstCard || "-",
        isAvailable: Boolean(firstCard),
      },
      {
        type: "insurance" as const,
        label: "Numero carte d'assurance",
        number: firstInsurance || "-",
        isAvailable: Boolean(firstInsurance),
      },
      {
        type: "registration" as const,
        label: "Numero papier d'immatriculation",
        number: registrationCode || "-",
        isAvailable: Boolean(registrationCode),
      },
    ];
  }, [vehicleData]);

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
    const optimizedUri = await optimizeImage(uri);
    await validateImageSize(optimizedUri);
    setImageUri(optimizedUri);
    setResult(null);
    setPlateQuery("");
    setVehicleData(null);
    setVehicleLookupError(null);
    setDocumentLookupError(null);
    setSelectedDocument(null);
    setDocumentDetailsError(null);
  };

  const loadVehicleByPlate = async (plateNumber: string) => {
    const vehicleResponse = await searchVehicleByPlate(plateNumber);
    setVehicleData(vehicleResponse.data);
    return vehicleResponse.data;
  };

  const searchDocumentsFromPlate = async (rawPlate?: string) => {
    const value = (rawPlate ?? plateQuery).trim().toUpperCase();

    if (!value) {
      setDocumentLookupError("Saisis ou confirme d'abord le numero d'immatriculation.");
      return;
    }

    setDocumentLoading(true);
    setDocumentLookupError(null);
    setVehicleLookupError(null);
    setSelectedDocument(null);
    setDocumentDetailsError(null);

    try {
      await loadVehicleByPlate(value);
      setPlateQuery(value);
    } catch (lookupErr: any) {
      const status = lookupErr?.response?.status;
      const lookupMessage =
        lookupErr?.response?.data?.message ||
        lookupErr?.response?.data?.detail ||
        lookupErr?.message;

      if (status === 404) {
        setDocumentLookupError("Aucun vehicule ou document n'a ete trouve pour cette immatriculation.");
      } else {
        setDocumentLookupError(
          typeof lookupMessage === "string" && lookupMessage
            ? lookupMessage
            : "Impossible de charger les informations liees a cette immatriculation."
        );
      }
    } finally {
      setDocumentLoading(false);
    }
  };

  const loadDocumentDetails = async (
    docType: DocumentReferenceType,
    label: string,
    number: string
  ) => {
    if (!number || number === "-") {
      setDocumentDetailsError("Aucun numero disponible pour ce document.");
      return;
    }

    setDocumentDetailsLoading(true);
    setDocumentDetailsError(null);
    setSelectedDocument(null);

    try {
      let data: any = null;

      if (docType === "vehicleCard") {
        data = await searchVehicleCard(number);
      } else if (docType === "insurance") {
        data = await searchVehicleInsurance(number);
      } else {
        data = await getVehicleRegistrationByCode(number);
      }

      setSelectedDocument({
        type: docType,
        label,
        number,
        data,
      });
    } catch (lookupErr: any) {
      const status = lookupErr?.response?.status;
      const lookupMessage =
        lookupErr?.response?.data?.message ||
        lookupErr?.response?.data?.detail ||
        lookupErr?.message;

      if (status === 404) {
        setDocumentDetailsError("Document introuvable pour ce numero.");
      } else {
        setDocumentDetailsError(
          typeof lookupMessage === "string" && lookupMessage
            ? lookupMessage
            : "Impossible de charger les details du document selectionne."
        );
      }
    } finally {
      setDocumentDetailsLoading(false);
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
        quality: 0.7,
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
        quality: 0.6,
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
    setVehicleData(null);
    setVehicleLookupError(null);
    setDocumentLookupError(null);
    setSelectedDocument(null);
    setDocumentDetailsError(null);

    try {
      const response = await scanVehiclePlate(imageUri, "ai");
      setResult(response.data.data);
      setPlateQuery((response.data.data.plate ?? "").toUpperCase());

      if (response.data.data.plate) {
        try {
          await loadVehicleByPlate(response.data.data.plate);
        } catch (lookupErr: any) {
          const status = lookupErr?.response?.status;
          const lookupMessage =
            lookupErr?.response?.data?.message ||
            lookupErr?.response?.data?.detail ||
            lookupErr?.message;

          if (status === 404) {
            setVehicleLookupError("Plaque detectee, mais vehicule introuvable dans la base.");
          } else {
            setVehicleLookupError(
              typeof lookupMessage === "string" && lookupMessage
                ? lookupMessage
                : "Plaque detectee, mais impossible de charger les informations du vehicule."
            );
          }
        }
      } else {
        setError(response.data.message || "Aucune plaque fiable n'a ete reconnue.");
      }
    } catch (err: any) {
      console.log("OCR ERROR:", err);
      console.log("OCR RESPONSE:", err?.response?.data);
      console.log("OCR STATUS:", err?.response?.status);
      console.log("OCR MESSAGE:", err?.message);

      const apiMessage = err?.response?.data?.message;

      if (apiMessage) {
        setError(apiMessage);
      } else if (
        err?.message?.includes("Network Error") ||
        err?.message?.includes("network request failed")
      ) {
        setError(
          `Connexion au serveur impossible pendant le scan OCR. Serveur actuel: ${API_BASE_URL}`
        );
      } else if (err?.code === "ECONNABORTED" || err?.message?.includes("timed out")) {
        setError("Le scan a pris trop de temps. Reessaie avec une image plus legere.");
      } else {
        setError(err?.message || "Echec du scan OCR.");
      }
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
          Charge une photo ou prends une image, puis envoie-la au backend OCR.
        </Text>

        <View style={pageStyles.card}>
          <View style={pageStyles.cardHeader}>
            <Text style={pageStyles.cardTitle}>Scan automatique</Text>
          </View>

          <Text style={styles.helperText}>
            Cadre la plaque et laisse l'application envoyer l'image au backend pour analyse.
          </Text>

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

          {result ? (
            <View style={styles.resultBox}>
              <Text style={styles.resultTitle}>Resultat</Text>
              <Text style={styles.value}>Plaque: {result.plate || "Non detectee"}</Text>
              <Text style={styles.value}>Confiance: {confidenceLabel}</Text>
              <Text style={styles.value}>Fiable: {result.is_reliable ? "Oui" : "Non"}</Text>
              <Text style={styles.value}>Source scan: {sourceLabel || "-"}</Text>
              <Text style={styles.value}>
                Candidats: {result.candidates.length ? result.candidates.join(", ") : "-"}
              </Text>
              <Text style={styles.value}>Texte brut: {result.raw_text || "-"}</Text>
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

              <Pressable
                style={[
                  pageStyles.primaryButton,
                  !plateQuery.trim() && { opacity: 0.6 },
                  documentLoading && { opacity: 0.7 },
                ]}
                onPress={() => searchDocumentsFromPlate()}
                disabled={documentLoading || !plateQuery.trim()}
              >
                {documentLoading ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator color="#000" size="small" />
                    <Text style={styles.scanBtnText}>Recherche documents...</Text>
                  </View>
                ) : (
                  <Text style={styles.scanBtnText}>Chercher vehicule et documents</Text>
                )}
              </Pressable>

              {documentLookupError ? (
                <Text style={styles.errorText}>{documentLookupError}</Text>
              ) : null}
            </View>
          ) : null}

          {vehicleLookupError ? <Text style={styles.warningText}>{vehicleLookupError}</Text> : null}

          {vehicleData ? (
            <View style={styles.resultBox}>
              <Text style={styles.resultTitle}>Analyse vehicule</Text>
              <Text style={styles.value}>
                Vehicule: {vehicleData.brand} {vehicleData.model}
              </Text>
              <Text style={styles.value}>Plaque base: {vehicleData.plate_number}</Text>
              <Text style={styles.value}>Couleur: {vehicleData.color}</Text>
              <Text style={styles.value}>Annee: {vehicleData.year}</Text>
              <Text style={styles.value}>
                Carte vehicule: {vehicleData.vehicle_cards[0]?.card_number || "-"}
              </Text>
              <Text style={styles.value}>
                Statut carte: {vehicleData.vehicle_cards[0]?.status || "-"}
              </Text>
              <Text style={styles.value}>
                Assurance: {vehicleData.insurances[0]?.policy_number || "-"}
              </Text>
              <Text style={styles.value}>
                Compagnie: {vehicleData.insurances[0]?.company_name || "-"}
              </Text>
              <Text style={styles.value}>
                Immatriculation: {vehicleData.registration?.registration_code || "-"}
              </Text>
            </View>
          ) : null}

          {vehicleData ? (
            <View style={styles.resultBox}>
              <Text style={styles.resultTitle}>Documents associes</Text>
              <Text style={styles.helperText}>
                Clique sur le type de papier pour afficher les details correspondants.
              </Text>
              {documentReferences.map((item) => (
                <Pressable
                  key={item.type}
                  style={[
                    styles.docItem,
                    !item.isAvailable && { opacity: 0.6 },
                  ]}
                  onPress={() => loadDocumentDetails(item.type, item.label, item.number)}
                  disabled={!item.isAvailable || documentDetailsLoading}
                >
                  <Text style={styles.docItemLabel}>{item.label}</Text>
                  <Text style={styles.docItemNumber}>{item.number}</Text>
                </Pressable>
              ))}

              {documentDetailsLoading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color="#000" size="small" />
                  <Text style={styles.scanBtnText}>Chargement du document...</Text>
                </View>
              ) : null}

              {documentDetailsError ? (
                <Text style={styles.errorText}>{documentDetailsError}</Text>
              ) : null}
            </View>
          ) : null}

          {selectedDocument ? (
            <View style={styles.resultBox}>
              <Text style={styles.resultTitle}>Details: {selectedDocument.label}</Text>
              <Text style={styles.value}>Numero: {selectedDocument.number}</Text>
              {Object.entries(selectedDocument.data).map(([key, value]) => (
                <View key={key} style={styles.detailRow}>
                  <Text style={styles.detailKey}>{prettyKey(key)}</Text>
                  <Text style={styles.value}>{normalizeValue(value)}</Text>
                </View>
              ))}
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
