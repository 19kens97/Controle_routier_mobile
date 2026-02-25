// src/api/documents.api.ts
import api from "./api";

export type DocumentType =
  | "DRIVER_LICENSE"
  | "VEHICLE_CARD"
  | "VEHICLE_INSURANCE"
  | "VEHICLE_REGISTRATION";

export async function searchDriverLicense(license_number: string) {
  const res = await api.get("documents/driver-license/search", {
    params: { license_number },
  });
  return res.data; // objet du permis
}

export async function searchVehicleCard(card_number: string) {
  const res = await api.get("documents/vehicle-cards/search/", {
    params: { card_number },
  });
  return res.data; // objet carte véhicule
}

export async function searchVehicleInsurance(policy_number: string) {
  const res = await api.get("documents/vehicle-insurances/search/", {
    params: { policy_number },
  });
  return res.data; // objet assurance
}

export async function getVehicleRegistrationByCode(registration_code: string) {
  const res = await api.get(`documents/registrations/${registration_code}/`);
  return res.data; // objet immatriculation
}