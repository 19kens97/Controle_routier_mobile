// src/api/auth.api.ts
import api from "./api";

export const FORGOT_PASSWORD_PATH = "users/password/reset/"; 

export async function requestPasswordReset(email: string) {
  const res = await api.post(FORGOT_PASSWORD_PATH, { email });
  return res.data; // ton backend renvoie sûrement { message, data, ... }
}

export async function changePassword(old_password: string, new_password: string) {
  const res = await api.post("users/password/change/", { old_password, new_password });
  return res.data; // {message,...}
}

export async function logout(refresh: string) {
  const res = await api.post("users/logout/", { refresh });
  return res.data;
}