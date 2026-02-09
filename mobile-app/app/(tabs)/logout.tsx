import { View, Text, Pressable } from "react-native";
import { clearTokens } from "@/src/utils/auth";
import { router } from "expo-router";

export default function Profile() {
  const handleLogout = async () => {
    await clearTokens();
    router.replace("/login");
  };

  return (
    <View>
      <Text>Profil utilisateur</Text>

      <Pressable onPress={handleLogout}>
        <Text style={{ color: "red" }}>Se déconnecter</Text>
      </Pressable>
    </View>
  );
}
