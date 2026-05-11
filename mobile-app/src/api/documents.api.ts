import api from "./api";

export type DocumentType =
  | "DRIVER_LICENSE"
  | "VEHICLE_CARD"
  | "VEHICLE_INSURANCE"
  | "VEHICLE_REGISTRATION";

export type VehicleDossierSection = "vehicle" | "insurance" | "tickets" | "all";

export type DriverLicenseSearchTicketSummary = {
  total: number;
  en_cours: number;
  regle: number;
};

export type DriverLicenseSearchResponse = {
  dossier: string;
  nif: string | null;
  nom: string;
  adresse: string | null;
  date_de_naissance: string | null;
  lieu_emission: string | null;
  sexe: string | null;
  groupe_sanguin: string | null;
  type: string | null;
  emis_le: string | null;
  expire_le: string | null;
  tickets_summary?: DriverLicenseSearchTicketSummary;
  tickets?: Array<Record<string, unknown>>;
};

export function normalizeDossierInput(value: string): string {
  const raw = value.trim().toUpperCase();
  if (!raw) return "";

  const compact = raw.replace(/[^A-Z0-9]/g, "");
  if (
    compact.length === 9 &&
    /^[A-Z]{2}$/.test(compact.slice(0, 2)) &&
    /^\d{5}$/.test(compact.slice(2, 7)) &&
    /^[A-Z]{2}$/.test(compact.slice(7, 9))
  ) {
    return `${compact.slice(0, 2)}-${compact.slice(2, 7)}-${compact.slice(7, 9)}`;
  }
  return raw;
}

export function normalizePlateNumberInput(value: string): string {
  const raw = value.trim().toUpperCase();
  if (!raw) return "";

  const compact = raw.replace(/[^A-Z0-9]/g, "");
  if (compact.length === 7) {
    return `${compact.slice(0, 2)}-${compact.slice(2)}`;
  }

  return raw;
}

function unwrapApiPayload<T>(payload: unknown): T {
  if (
    payload &&
    typeof payload === "object" &&
    "success" in (payload as Record<string, unknown>) &&
    "data" in (payload as Record<string, unknown>)
  ) {
    return (payload as { data: T }).data;
  }

  return payload as T;
}

export async function searchDriverLicense(dossier: string) {
  const res = await api.get("documents/driver-license/search", {
    params: { dossier: normalizeDossierInput(dossier) },
  });
  return unwrapApiPayload<DriverLicenseSearchResponse>(res.data);
}

export async function searchVehicleCard(card_number: string) {
  const res = await api.get("documents/vehicle-cards/search/", {
    params: { card_number },
  });
  return unwrapApiPayload<Record<string, unknown>>(res.data);
}

export async function searchVehicleInsurance(policy_number: string) {
  const res = await api.get("documents/vehicle-insurances/search/", {
    params: { policy_number },
  });
  return unwrapApiPayload<Record<string, unknown>>(res.data);
}

export async function getVehicleRegistrationByCode(registration_code: string) {
  const res = await api.get(`documents/registrations/${registration_code}/`);
  return unwrapApiPayload<Record<string, unknown>>(res.data);
}

export async function getVehicleDossierByPlate(
  plate_number: string,
  section: VehicleDossierSection = "all"
) {
  const res = await api.get("vehicles/dossier/", {
    params: { plate_number, section },
  });
  return unwrapApiPayload<Record<string, unknown>>(res.data);
}
