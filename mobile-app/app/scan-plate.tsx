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
import { scanVehiclePlate } from "../src/api/vehicles.api";

type ScanResult = {
  plate: string | null;
  confidence: number;
  candidates: string[];
  raw_text: string;
  is_reliable: boolean;
};

export default function ScanPlateScreen() {
  const { theme } = useAppTheme();
  const pageStyles = useMemo(() => createPageStyles(theme), [theme]);
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);

  const confidenceLabel = useMemo(() => {
    if (!result) return "";
    return `${Math.round(result.confidence * 100)}%`;
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
      [{ resize: { width: 1600 } }],
      {
        compress: 0.65,
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
      throw new Error("Image trop volumineuse apres compression (plus de 5 MB).");
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

    try {
      const response = await scanVehiclePlate(imageUri, "ai");
      setResult(response.data.data);
    } catch (err: any) {
      console.log("OCR ERROR:", err);
      console.log("OCR RESPONSE:", err?.response?.data);
      console.log("OCR STATUS:", err?.response?.status);
      console.log("OCR MESSAGE:", err?.message);

      const apiMessage = err?.response?.data?.message;

      if (apiMessage) {
        setError(apiMessage);
      } else if (err?.message?.includes("Network Error")) {
        setError(
          `Connexion au serveur impossible pendant le scan OCR. Serveur actuel: ${API_BASE_URL}`
        );
      } else if (err?.code === "ECONNABORTED") {
        setError("Le scan a pris trop de temps. Reessaie avec une image plus legere.");
      } else {
        setError("Echec du scan OCR.");
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
            L'application choisit automatiquement le meilleur mode de lecture pour la plaque.
          </Text>

          <View style={styles.actionRow}>
            <Pressable style={styles.actionBtn} onPress={pickFromLibrary}>
              <Text style={styles.actionBtnText}>Choisir photo</Text>
            </Pressable>

            <Pressable style={styles.actionBtn} onPress={pickFromCamera}>
              <Text style={styles.actionBtnText}>Prendre photo</Text>
            </Pressable>
          </View>

          {imageUri ? <Image source={{ uri: imageUri }} style={styles.preview} /> : null}

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
              <Text style={styles.value}>
                Candidats: {result.candidates.length ? result.candidates.join(", ") : "-"}
              </Text>
              <Text style={styles.value}>Texte brut: {result.raw_text || "-"}</Text>
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
      borderWidth: 1,
      borderColor: theme.colors.border2,
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
    errorText: {
      color: theme.colors.danger,
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
