import api from "./api";

export type InfractionItem = {
  id: number;
  code: string;
  description: string;
  article: string | null;
  penalty: string;
  category: string | null;
};

type InfractionsListResponse = {
  success: boolean;
  message: string;
  data: InfractionItem[];
};

export async function fetchInfractions() {
  const response = await api.get<InfractionsListResponse>("infractions/");
  return response.data.data;
}
