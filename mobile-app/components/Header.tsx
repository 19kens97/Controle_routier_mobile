// components/Header.tsx
import { View } from "react-native";
import UserMenu from "./UserMenu";

export default function Header() {
  return (
    <View
      style={{
        height: 60,
        backgroundColor: "#00796b",
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
