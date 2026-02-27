import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { router } from "expo-router";

import Login from "../app/login";
import api from "../src/api/api";
import { saveTokens } from "../src/utils/auth";

jest.mock("expo-router", () => ({
  router: {
    replace: jest.fn(),
    push: jest.fn(),
    back: jest.fn(),
  },
}));

jest.mock("../src/api/api", () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
  },
}));

jest.mock("../src/utils/auth", () => ({
  saveTokens: jest.fn(),
}));

describe("Login screen", () => {
  it("logs in and redirects to tabs on success", async () => {
    (api.post as jest.Mock).mockResolvedValueOnce({
      data: {
        data: {
          access_token: "access-token",
          refresh_token: "refresh-token",
        },
      },
    });

    const { getByPlaceholderText, getByText } = render(<Login />);

    fireEvent.changeText(getByPlaceholderText(/utilisateur/i), "agent1");
    fireEvent.changeText(getByPlaceholderText(/mot de passe/i), "password123");
    fireEvent.press(getByText("Connexion"));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("users/login/", {
        username: "agent1",
        password: "password123",
      });
      expect(saveTokens).toHaveBeenCalledWith("access-token", "refresh-token");
      expect(router.replace).toHaveBeenCalledWith("/(tabs)");
    });
  });

  it("shows backend error message on failed login", async () => {
    (api.post as jest.Mock).mockRejectedValueOnce({
      response: { data: { message: "Identifiants invalides" } },
    });

    const { getByPlaceholderText, getByText, findByText } = render(<Login />);

    fireEvent.changeText(getByPlaceholderText(/utilisateur/i), "agent1");
    fireEvent.changeText(getByPlaceholderText(/mot de passe/i), "badpass");
    fireEvent.press(getByText("Connexion"));

    expect(await findByText("Identifiants invalides")).toBeTruthy();
  });
});

