// app/(tabs)/settings.tsx
import { View, Text, StyleSheet } from "react-native";
// import Header from "../../components/Header";

export default function Settings() {
  return (
    <View style={styles.container}>
      {/* <Header />  */}
      <Text style={styles.title}>Paramètres</Text>
      <Text style={styles.subtitle}>Options de l'application et préférences</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#e0f2f1", padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", color: "#00796b", marginBottom: 10 },
  subtitle: { fontSize: 16, color: "#333" },
});
