// components/UserMenu.tsx
import { View, Pressable, Text } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

import { logout } from "@/src/utils/auth";
import { theme } from "@/constants/theme";

export default function UserMenu() {
  const [menuVisible, setMenuVisible] = useState(false);

  const handleLogout = async () => {
    setMenuVisible(false);
    await logout();
    router.replace("/login");
  };

  return (
    <View style={{ position: "relative" }}>
      {/* Icône utilisateur */}
      <Pressable onPress={() => setMenuVisible((v) => !v)} hitSlop={10}>
        <MaterialIcons name="account-circle" size={32} color={theme.colors.text} />
      </Pressable>

      {/* Menu déroulant */}
      {menuVisible && (
        <View
          style={{
            position: "absolute",
            top: 44,
            right: 0,
            minWidth: 180,
            backgroundColor: "rgba(255,255,255,0.96)",
            paddingVertical: 8,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "rgba(0,0,0,0.08)",
            elevation: 8,
            zIndex: 999,
          }}
        >
          <MenuItem
            label="Profil"
            onPress={() => {
              setMenuVisible(false);
              router.push("/(tabs)/profile");
            }}
          />
          <MenuItem
            label="Paramètres"
            onPress={() => {
              setMenuVisible(false);
              router.push("/(tabs)/settings");
            }}
          />
          <View style={{ height: 1, backgroundColor: "rgba(0,0,0,0.06)", marginVertical: 6 }} />
          <MenuItem
            label="Se déconnecter"
            danger
            onPress={handleLogout}
          />
        </View>
      )}
    </View>
  );
}

function MenuItem({
  label,
  onPress,
  danger,
}: {
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          paddingHorizontal: 12,
          paddingVertical: 10,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Text
        style={{
          fontSize: 14,
          fontWeight: "700",
          color: danger ? "#B00020" : "#0B2A4A",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
