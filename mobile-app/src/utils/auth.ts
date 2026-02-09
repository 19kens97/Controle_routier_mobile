import * as SecureStore from "expo-secure-store";

export const saveTokens = async (access: string, refresh: string) => {
  if (typeof access !== "string" || typeof refresh !== "string") {
    throw new Error("Tokens invalides");
  }

  await SecureStore.setItemAsync("access", access);
  await SecureStore.setItemAsync("refresh", refresh);
};

export async function isAuthenticated(): Promise<boolean> {
  const token = await SecureStore.getItemAsync("access");
  return !!token;
}

export const clearTokens = async () => {
  await SecureStore.deleteItemAsync("access");
  await SecureStore.deleteItemAsync("refresh");
};


