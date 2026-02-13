// components/Header.tsx
import { View } from "react-native";
import UserMenu from "./UserMenu";
import { theme } from "../constants/theme";

export default function Header() {
  return (
    <View
      style={{
        height: 60,
        backgroundColor: "rgba(255,255,255,0.06)",
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.10)",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
        paddingHorizontal: 15,
      }}
    >
      <UserMenu />
    </View>
  );
}
