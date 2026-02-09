import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { useState } from "react";
import api from "../src/api/api";
import { saveTokens } from "../src/utils/auth";
import { router } from "expo-router";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (loading) return; // 🔐 bloque double clic / double render

    setLoading(true);
    try {
      const res = await api.post("login/", {
        username,
        password,
      });

      console.log("Réponse API:", res.data);

      const access = res.data.data.access_token;
      const refresh = res.data.data.refresh_token;

      console.log("Access type:", typeof access);
      console.log("Refresh type:", typeof refresh);

      // await saveTokens(access, refresh);
      await saveTokens(JSON.stringify(access), JSON.stringify(refresh));

      router.replace("/(tabs)");
    } catch (error: any) {
      console.log("Erreur login:", error.response?.data || error.message);
      alert("Échec de connexion");
    } finally {
      setLoading(false);
    }
  };



  return (
    <View style={styles.container}>
      <Text style={styles.title}>CONTROLE ROUTIER</Text>

      {/* Carte centrée */}
      <View style={styles.card}>
        <Text style={styles.title}>Connexion</Text>

        <TextInput
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          style={styles.input}
        />

        <TextInput
          placeholder="Mot de passe"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.input}
        />

        <Pressable
          style={({ pressed }) => [styles.button, pressed && { opacity: 0.7 }]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Connexion..." : "Se connecter"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center", // centrer verticalement
    alignItems: "center", // centrer horizontalement
    backgroundColor: "#e0f2f1",
    padding: 20,
  },
  card: {
    width: "90%",
    padding: 30,
    borderRadius: 12,
    backgroundColor: "#fff",
    // Shadow pour iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    // Elevation pour Android
    elevation: 5,
    alignItems: "center", // centre tout dans la carte
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 25,
    color: "#333",
  },
  input: {
    width: "100%",
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: "#f9f9f9",
  },
  button: {
    width: "100%",
    height: 50,
    backgroundColor: "#00796b",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});
