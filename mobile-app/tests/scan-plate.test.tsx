import React from "react";
import { Alert } from "react-native";
import { fireEvent, render, waitFor } from "@testing-library/react-native";

import ScanPlateScreen from "../app/scan-plate";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system/legacy";
import { searchVehicleByPlate } from "../src/api/vehicles.api";
import { scanGeminiDirect } from "../src/api/gemini.api";

jest.mock("expo-router", () => ({
  router: {
    replace: jest.fn(),
    push: jest.fn(),
    back: jest.fn(),
  },
}));

jest.mock("expo-image-picker", () => ({
  getCameraPermissionsAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

jest.mock("expo-image-manipulator", () => ({
  manipulateAsync: jest.fn(),
  SaveFormat: { JPEG: "jpeg" },
}));

jest.mock("expo-file-system/legacy", () => ({
  getInfoAsync: jest.fn(),
}));

jest.mock("../src/api/vehicles.api", () => ({
  searchVehicleByPlate: jest.fn(),
}));

jest.mock("../src/api/gemini.api", () => ({
  scanGeminiDirect: jest.fn(),
}));

describe("Scan plate screen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (ImageManipulator.manipulateAsync as jest.Mock).mockResolvedValue({
      uri: "file:///optimized.jpg",
    });
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
      exists: true,
      size: 1024 * 1024,
    });
  });

  it("requests camera permission when pressing Prendre photo", async () => {
    jest.spyOn(Alert, "alert").mockImplementation((title: any, message?: any, buttons?: any) => {
      if (title === "Autorisation camera") {
        const continueBtn = buttons?.find((btn: any) => btn.text === "Continuer");
        continueBtn?.onPress?.();
      }
    });

    (ImagePicker.getCameraPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      granted: false,
      canAskAgain: true,
    });
    (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      granted: true,
      canAskAgain: true,
    });
    (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValueOnce({
      canceled: true,
      assets: [],
    });

    const { getByText } = render(<ScanPlateScreen />);
    fireEvent.press(getByText("Prendre photo"));

    await waitFor(() => {
      expect(ImagePicker.requestCameraPermissionsAsync).toHaveBeenCalledTimes(1);
    });
  });

  it("shows settings alert when camera permission is denied", async () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation((title: any, message?: any, buttons?: any) => {
      if (title === "Autorisation camera") {
        const continueBtn = buttons?.find((btn: any) => btn.text === "Continuer");
        continueBtn?.onPress?.();
      }
    });
    (ImagePicker.getCameraPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      granted: false,
      canAskAgain: true,
    });
    (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      granted: false,
      canAskAgain: false,
    });

    const { getByText, findByText } = render(<ScanPlateScreen />);
    fireEvent.press(getByText("Prendre photo"));

    expect(await findByText("L'acces a la camera est requis pour prendre une photo de la plaque.")).toBeTruthy();
    expect(alertSpy).toHaveBeenCalledWith(
      "Acces camera requis",
      expect.stringContaining("active la camera"),
      expect.any(Array)
    );
  });

  it("loads vehicle details after a successful scan", async () => {
    (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      granted: true,
    });
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: "file:///picked.jpg" }],
    });
    (scanGeminiDirect as jest.Mock).mockResolvedValueOnce({
      plateNumber: "AB-12345",
      rawResponse: {
        status: "success",
        plate_number: "AB-12345",
        model_used: "gemini-2.5-flash",
      },
    });
    (searchVehicleByPlate as jest.Mock).mockResolvedValueOnce({
      success: true,
      message: "Vehicule trouve.",
      data: {
        id: 1,
        plate_number: "AB-12345",
        brand: "Toyota",
        model: "Corolla",
        color: "Blue",
        year: 2022,
        vehicle_cards: [{ id: 1, vehicle: 1, card_number: "CV-12345", issue_date: "2025-01-01", expiration_date: "2027-01-01", status: "active", printed_by: "DGI", category: "private" }],
        insurances: [{ id: 1, vehicle: 1, company_name: "Assur Haiti", policy_number: "POL-9001", issued_date: "2025-01-01", expiration_date: "2026-12-31", is_active: true }],
        registration: { id: 1, vehicle: 1, registration_code: "REG-HT-9001", registration_type: "standard", issued_date: "2025-01-01", expiry_date: "2026-12-31" },
      },
    });

    const { getByText, findByText } = render(<ScanPlateScreen />);

    fireEvent.press(getByText("Choisir photo"));
    await findByText("Lancer le scan");
    fireEvent.press(getByText("Lancer le scan"));

    expect(await findByText("Analyse vehicule")).toBeTruthy();
    expect(await findByText("Vehicule: Toyota Corolla")).toBeTruthy();
    expect(searchVehicleByPlate).toHaveBeenCalledWith("AB-12345");
  });
});
