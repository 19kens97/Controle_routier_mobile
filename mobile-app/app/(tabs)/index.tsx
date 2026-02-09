import { View, Text, StyleSheet } from "react-native";
// import Header from "../../components/Header";

export default function Home() {
  return (
    <View style={{ flex: 1 }}>
      {/* Header en haut */}
      {/* <Header /> */}

      {/* Contenu principal */}
      <View style={styles.container}>
        <Text style={styles.title}>Bienvenue sur le tableau de bord !</Text>
        <Text style={styles.subtitle}>Connexion réussie</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e0f2f1",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#00796b",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    color: "#333",
    textAlign: "center",
  },
});
