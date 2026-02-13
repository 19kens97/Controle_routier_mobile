// src/api/auth.api.ts
import api from "./api";

export const FORGOT_PASSWORD_PATH = "users/password-reset/"; 

export async function requestPasswordReset(email: string) {
  const res = await api.post(FORGOT_PASSWORD_PATH, { email });
  return res.data; // ton backend renvoie sûrement { message, data, ... }
}
