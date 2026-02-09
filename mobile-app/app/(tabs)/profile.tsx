// app/(tabs)/profile.tsx
import { View, Text, StyleSheet } from "react-native";
// import Header from "../../components/Header"; // si tu veux le Header commun

export default function Profile() {
  return (
    <View style={styles.container}>
      {/* <Header /> ton header avec l'icône utilisateur */}
      <Text style={styles.title}>Profil utilisateur</Text>
      <Text style={styles.subtitle}>Informations personnelles et préférences</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#e0f2f1", padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", color: "#00796b", marginBottom: 10 },
  subtitle: { fontSize: 16, color: "#333" },
});
