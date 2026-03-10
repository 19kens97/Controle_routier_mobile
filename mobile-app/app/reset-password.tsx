// app/reset-password.tsx
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";

import api from "../src/api/api";
import Screen from "../components/screen";
import { AppTheme } from "../constants/theme";
import { useAppTheme } from "../src/providers/theme.provider";
import { createPageStyles } from "../src/ui/page-styles";

export default function ResetPasswordScreen() {
  const { theme } = useAppTheme();
  const pageStyles = useMemo(() => createPageStyles(theme), [theme]);
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { uid, token } = useLocalSearchParams<{ uid?: string; token?: string }>();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [hidePass1, setHidePass1] = useState(true);
  const [hidePass2, setHidePass2] = useState(true);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const canSubmit = useMemo(() => {
    return !!uid && !!token && password.length >= 8 && password === confirm && !loading;
  }, [uid, token, password, confirm, loading]);

  async function submit() {
    setErrorMsg("");

    if (!uid || !token) {
      Alert.alert("Lien invalide", "Le lien de réinitialisation est incomplet.");
      return;
    }
    if (password !== confirm) {
      setErrorMsg("Les mots de passe ne correspondent pas.");
      return;
    }

    try {
      setLoading(true);

      await api.post("users/password/reset/confirm/", {
        uid,
        token,
        new_password: password,
      });

      Alert.alert("Succès", "Mot de passe réinitialisé. Connecte-toi maintenant.", [
        { text: "OK", onPress: () => router.replace("/login") },
      ]);
    } catch (error: any) {
      const apiMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Impossible de réinitialiser le mot de passe (token expiré ?).";

      setErrorMsg(String(apiMessage));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.container}
        >
          {/* Header + Logo */}
          <View style={styles.header}>
            <Image
              source={require("../assets/images/icon.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.brand}>Contrôle Routier</Text>
            <Text style={styles.sub}>Réinitialisation du mot de passe</Text>
          </View>

          {/* Card */}
          <View style={pageStyles.card}>
            <Text style={pageStyles.cardTitle}>Nouveau mot de passe</Text>

            {/* Indication si lien incomplet */}
            {(!uid || !token) && (
              <Text style={styles.warn}>
                Lien invalide ou incomplet. Refais une demande “Mot de passe oublié”.
              </Text>
            )}

            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color="rgba(255,255,255,0.7)" />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Nouveau mot de passe"
                placeholderTextColor="rgba(255,255,255,0.35)"
                secureTextEntry={hidePass1}
                style={styles.input}
                returnKeyType="next"
              />
              <Pressable onPress={() => setHidePass1((v) => !v)} hitSlop={10}>
                <Ionicons
                  name={hidePass1 ? "eye-outline" : "eye-off-outline"}
                  size={18}
                  color="rgba(255,255,255,0.7)"
                />
              </Pressable>
            </View>

            <View style={styles.inputWrap}>
              <Ionicons name="shield-checkmark-outline" size={18} color="rgba(255,255,255,0.7)" />
              <TextInput
                value={confirm}
                onChangeText={setConfirm}
                placeholder="Confirmer le mot de passe"
                placeholderTextColor="rgba(255,255,255,0.35)"
                secureTextEntry={hidePass2}
                style={styles.input}
                returnKeyType="done"
                onSubmitEditing={submit}
              />
              <Pressable onPress={() => setHidePass2((v) => !v)} hitSlop={10}>
                <Ionicons
                  name={hidePass2 ? "eye-outline" : "eye-off-outline"}
                  size={18}
                  color="rgba(255,255,255,0.7)"
                />
              </Pressable>
            </View>

            <Text style={styles.hint}>
              Minimum 8 caractères. Utilise une combinaison de lettres, chiffres et symbole.
            </Text>

            {!!errorMsg && <Text style={styles.error}>{errorMsg}</Text>}

            <Pressable
              onPress={submit}
              disabled={!canSubmit}
              style={({ pressed }) => [
                pageStyles.primaryButton,
                !canSubmit && styles.buttonDisabled,
                pressed && canSubmit && { transform: [{ scale: 0.99 }] },
              ]}
            >
              {loading ? <ActivityIndicator /> : <Text style={pageStyles.primaryButtonText}>Valider</Text>}
            </Pressable>

            <Pressable
              onPress={() => router.replace("/login")}
              style={({ pressed }) => [styles.back, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.backText}>Retour à la connexion</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </Screen>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
  container: { flex: 1, paddingHorizontal: theme.spacing.lg, justifyContent: "center" },

  header: { alignItems: "center", marginBottom: theme.spacing.lg },
  logo: { width: 62, height: 62, marginBottom: 10 },
  brand: { color: theme.colors.text, fontSize: theme.font.h1, fontWeight: "800" },
  sub: { marginTop: 6, color: theme.colors.textDim, fontSize: theme.font.small, fontWeight: "700" },
  warn: { color: "rgba(255,215,0,0.85)", fontSize: theme.font.small, marginBottom: 10, fontWeight: "600" },

  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    height: 52,
    borderRadius: theme.radius.md,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 12,
  },
  input: { flex: 1, color: theme.colors.text, fontSize: theme.font.body },

  hint: { marginTop: -2, marginBottom: 10, color: theme.colors.textMuted, fontSize: theme.font.small },

  error: { color: "#FFB4B4", fontSize: theme.font.small, marginBottom: 10 },

  buttonDisabled: { opacity: 0.45 },

  back: { alignSelf: "center", marginTop: 14 },
  backText: { color: "rgba(255,255,255,0.7)", fontSize: theme.font.small, fontWeight: "700" },
  });
}
