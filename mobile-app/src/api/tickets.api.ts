import api from "./api";

export type TicketPrefillData = {
  agent: {
    id: number;
    username: string;
    full_name: string;
    role: string;
  };
  plate_number: string;
  vehicle_found: boolean;
  vehicle: {
    id: number;
    plate_number: string;
    brand: string;
    model: string;
    color: string;
    year: number;
  } | null;
  location: string;
  position: {
    latitude: number | null;
    longitude: number | null;
  };
  date: string;
  time: string;
  occurred_at: string;
};

type TicketPrefillResponse = {
  success: boolean;
  message: string;
  data: TicketPrefillData;
};

type TicketCreateRequest = {
  plate_number: string;
  motif: string;
  amount: string;
  latitude?: number;
  longitude?: number;
  location_label?: string;
  photos?: string[];
};

type TicketCreateResponse = {
  success: boolean;
  message: string;
  data: {
    id: number;
    ticket_number: string;
    timestamp: string;
    location: string;
    photos: string[] | null;
    status: string;
    paid_at: string | null;
    payment_reference: string | null;
    agent: {
      id: number;
      username: string;
      first_name: string | null;
      last_name: string | null;
      role: string;
    };
    vehicle: {
      id: number;
      plate_number: string;
      brand: string;
      model: string;
      color: string;
      year: number;
    };
    infraction: {
      id: number;
      code: string;
      description: string;
      penalty: string;
      category: string;
    };
  };
};

type TicketCreateManualRequest = {
  plate_number: string;
  motif: string;
  amount: string;
  latitude?: number;
  longitude?: number;
  location_label?: string;
};

export async function fetchTicketPrefill(params?: {
  plate_number?: string;
  latitude?: number;
  longitude?: number;
  location_label?: string;
}) {
  const response = await api.get<TicketPrefillResponse>("tickets/prefill/", { params });
  return response.data;
}

export async function createTicketFromPlate(payload: TicketCreateRequest) {
  const response = await api.post<TicketCreateResponse>("tickets/create-from-plate/", payload);
  return response.data;
}

export async function createManualTicket(payload: TicketCreateManualRequest) {
  const response = await api.post<TicketCreateResponse>("tickets/create-manual/", payload);
  return response.data;
}
