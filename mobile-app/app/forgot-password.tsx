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
  ActivityIndicator,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { requestPasswordReset } from "../src/api/auth.api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const canSubmit = useMemo(() => {
    const e = email.trim();
    return e.includes("@") && e.includes(".") && !loading;
  }, [email, loading]);

  async function handleSubmit() {
    if (!canSubmit) return;

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const data = await requestPasswordReset(email.trim());

      // adapte selon la forme de ta réponse backend
      const msg = data?.message || "Un email de réinitialisation a été envoyé.";
      setSuccessMsg(String(msg));
    } catch (err: any) {
      const apiMessage =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        "Impossible d’envoyer l’email. Vérifie l’adresse ou la connexion.";
      setErrorMsg(String(apiMessage));
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient
      colors={["#071321", "#0B2A4A", "#071321"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.container}
        >
          <View style={styles.header}>
            <Image
              source={require("../assets/images/icon.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.brand}>Mot de passe oublié</Text>
            <Text style={styles.sub}>
              Entre ton email et on t’enverra un lien de réinitialisation.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Réinitialisation</Text>

            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={18} color="rgba(255,255,255,0.7)" />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                placeholderTextColor="rgba(255,255,255,0.35)"
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />
            </View>

            {!!errorMsg && <Text style={styles.error}>{errorMsg}</Text>}
            {!!successMsg && <Text style={styles.success}>{successMsg}</Text>}

            <Pressable
              onPress={handleSubmit}
              disabled={!canSubmit}
              style={({ pressed }) => [
                styles.button,
                !canSubmit && styles.buttonDisabled,
                pressed && canSubmit && { transform: [{ scale: 0.99 }] },
              ]}
            >
              {loading ? <ActivityIndicator /> : <Text style={styles.buttonText}>Envoyer</Text>}
            </Pressable>

            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.75 }]}
            >
              <Text style={styles.backText}>Retour</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 18, justifyContent: "center" },

  header: { alignItems: "center", marginBottom: 16 },
  logo: { width: 56, height: 56, marginBottom: 10 },
  brand: { color: "white", fontSize: 22, fontWeight: "800", textAlign: "center" },
  sub: { marginTop: 8, color: "rgba(255,255,255,0.65)", fontSize: 13, textAlign: "center" },

  card: {
    borderRadius: 22,
    padding: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  cardTitle: { color: "white", fontSize: 16, fontWeight: "700", marginBottom: 14 },

  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    height: 52,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    marginBottom: 12,
  },
  input: { flex: 1, color: "white", fontSize: 14 },

  error: { color: "#FFB4B4", fontSize: 12, marginBottom: 10 },
  success: { color: "rgba(160, 255, 190, 0.95)", fontSize: 12, marginBottom: 10 },

  button: {
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 215, 0, 0.22)",
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.35)",
  },
  buttonDisabled: { opacity: 0.45 },
  buttonText: { color: "white", fontSize: 15, fontWeight: "800" },

  backBtn: { marginTop: 12, alignItems: "center" },
  backText: { color: "rgba(255,255,255,0.7)", fontWeight: "700" },
});
