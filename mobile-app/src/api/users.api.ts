// src/api/users.api.ts
import api from "./api";

export type UserProfile = {
  username: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  role: string;
  nif?: string | null;
  date_of_birth?: string | null;
  phone_number?: string | null;
};

export async function getUserProfile() {
  return (await api.get("users/profile/")).data;
}