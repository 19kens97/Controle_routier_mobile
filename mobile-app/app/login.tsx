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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import api from "../src/api/api";
import { saveTokens } from "../src/utils/auth";
import Screen from "../components/screen";
import { theme } from "../constants/theme";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [hidePass, setHidePass] = useState(true);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const canSubmit = useMemo(() => {
    return username.trim().length > 1 && password.length > 3 && !loading;
  }, [username, password, loading]);

  const handleLogin = async () => {
    if (!canSubmit) return;

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await api.post("users/login/", {
        username: username.trim(),
        password,
      });

      const access = res?.data?.data?.access_token;
      const refresh = res?.data?.data?.refresh_token;

      if (!access || !refresh) {
        throw new Error("Tokens manquants dans la réponse API.");
      }

      await saveTokens(access, refresh);

      // ✅ recommandé si tu as app/index.tsx (Redirect gate)
      router.replace("/(tabs)");
      // sinon: router.replace("/(tabs)");
    } catch (error: any) {
      const apiMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Identifiants incorrects ou serveur indisponible.";

      setErrorMsg(String(apiMessage));
    } finally {
      setLoading(false);
    }
  };

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
            <Text style={styles.sub}>Connexion sécurisée</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Se connecter</Text>

            <View style={styles.inputWrap}>
              <Ionicons name="person-outline" size={18} color="rgba(255,255,255,0.7)" />
              <TextInput
                value={username}
                onChangeText={setUsername}
                placeholder="Nom d’utilisateur"
                placeholderTextColor="rgba(255,255,255,0.35)"
                autoCapitalize="none"
                style={styles.input}
                returnKeyType="next"
              />
            </View>

            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color="rgba(255,255,255,0.7)" />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Mot de passe"
                placeholderTextColor="rgba(255,255,255,0.35)"
                secureTextEntry={hidePass}
                style={styles.input}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <Pressable onPress={() => setHidePass((v) => !v)} hitSlop={10}>
                <Ionicons
                  name={hidePass ? "eye-outline" : "eye-off-outline"}
                  size={18}
                  color="rgba(255,255,255,0.7)"
                />
              </Pressable>
            </View>

            <Pressable
              onPress={() => router.push("/forgot-password")}
              style={({ pressed }) => [styles.forgot, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
            </Pressable>

            {!!errorMsg && <Text style={styles.error}>{errorMsg}</Text>}

            <Pressable
              onPress={handleLogin}
              disabled={!canSubmit}
              style={({ pressed }) => [
                styles.button,
                !canSubmit && styles.buttonDisabled,
                pressed && canSubmit && { transform: [{ scale: 0.99 }] },
              ]}
            >
              {loading ? <ActivityIndicator /> : <Text style={styles.buttonText}>Connexion</Text>}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: theme.spacing.lg, justifyContent: "center" },

  header: { alignItems: "center", marginBottom: theme.spacing.lg },
  logo: { width: 62, height: 62, marginBottom: 10 },
  brand: { color: theme.colors.text, fontSize: 26, fontWeight: "800" },
  sub: { marginTop: 6, color: theme.colors.textMuted, fontSize: 13 },

  card: {
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardTitle: { color: theme.colors.text, fontSize: 18, fontWeight: "700", marginBottom: 14 },

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
  input: { flex: 1, color: theme.colors.text, fontSize: 14 },

  forgot: { alignSelf: "flex-end", marginTop: -4, marginBottom: 10 },
  forgotText: { color: "rgba(255,215,0,0.85)", fontSize: 12, fontWeight: "600" },

  error: { color: "#FFB4B4", fontSize: 12, marginBottom: 10 },

  button: {
    height: 50,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 215, 0, 0.22)",
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.35)",
  },
  buttonDisabled: { opacity: 0.45 },
  buttonText: { color: theme.colors.text, fontSize: 15, fontWeight: "800" },
});
