import React from "react";
import { Alert } from "react-native";
import { fireEvent, render, waitFor } from "@testing-library/react-native";

import ScanPlateScreen from "../app/scan-plate";
import * as ImagePicker from "expo-image-picker";

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

jest.mock("../src/api/vehicles.api", () => ({
  scanVehiclePlate: jest.fn(),
}));

describe("Scan plate screen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
});
