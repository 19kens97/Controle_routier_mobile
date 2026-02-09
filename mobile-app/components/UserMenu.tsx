// components/UserMenu.tsx
import { View, Pressable, Text } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { clearTokens } from "@/src/utils/auth";
import { MaterialIcons } from "@expo/vector-icons";

export default function UserMenu() {
  const [menuVisible, setMenuVisible] = useState(false);

  const handleLogout = async () => {
    await clearTokens();
    router.replace("/login");
  };

  return (
    <View>
      {/* Icône utilisateur */}
      <Pressable onPress={() => setMenuVisible(!menuVisible)}>
        <MaterialIcons name="account-circle" size={32} color="#fff" />
      </Pressable>

      {/* Menu déroulant */}
      {menuVisible && (
        <View
          style={{
            position: "absolute",
            top: 50, // sous l'icône
            right: 0,
            backgroundColor: "#fff",
            padding: 10,
            borderRadius: 8,
            elevation: 5,
            zIndex: 10, // s'assure que le menu soit au-dessus
          }}
        >
          <Pressable onPress={() => router.push("/profile")}>
            <Text style={{ paddingVertical: 5 }}>Profil</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/settings")}>
            <Text style={{ paddingVertical: 5 }}>Paramètres</Text>
          </Pressable>
          <Pressable onPress={handleLogout}>
            <Text style={{ paddingVertical: 5, color: "red" }}>Se déconnecter</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
