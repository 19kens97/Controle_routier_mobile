import { Text, StyleSheet, View } from "react-native";
import Screen from "../../components/screen";

export default function Settings() {
  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>Statistiques</Text>
        <Text style={styles.subtitle}>Options de l&apos;application et preferences</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", color: "#00796b", marginBottom: 10 },
  subtitle: { fontSize: 16, color: "#333" },
});
