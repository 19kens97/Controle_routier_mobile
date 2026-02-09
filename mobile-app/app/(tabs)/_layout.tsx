// app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import { View, StyleSheet } from "react-native";
import Header from "../../components/Header"; // ton Header avec UserMenu

export default function TabsLayout() {
  return (
    <View style={styles.container}>
      {/* Header commun */}
      <Header />

      {/* Les onglets */}
      <Tabs
        screenOptions={{
          headerShown: false, // on utilise notre propre header
        }}
      >
        <Tabs.Screen name="index" options={{ title: "Accueil" }} />
        <Tabs.Screen name="profile" options={{ title: "Profil" }} />
        <Tabs.Screen name="settings" options={{ title: "Paramètres" }} />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
