import api from "./api";

export type DocumentType =
  | "DRIVER_LICENSE"
  | "VEHICLE_CARD"
  | "VEHICLE_INSURANCE"
  | "VEHICLE_REGISTRATION"
  | "VEHICLE_DOSSIER";

export type VehicleDossierSection = "all" | "vehicle" | "documents" | "tickets";

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

export async function searchDriverLicense(license_number: string) {
  const res = await api.get("documents/driver-license/search", {
    params: { license_number },
  });
  return unwrapApiPayload<Record<string, unknown>>(res.data);
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
