type ApiErrorMapping = {
  badRequest?: string;
  unauthorized?: string;
  forbidden?: string;
  notFound?: string;
  timeout?: string;
  network?: string;
  fallback?: string;
};

export function getApiErrorMessage(error: any, mapping: ApiErrorMapping = {}): string {
  const status = error?.response?.status;
  const payload = error?.response?.data;
  const backendMessage =
    payload?.message ??
    payload?.detail ??
    (typeof payload === "string" ? payload : null) ??
    null;

  if (status === 400) return mapping.badRequest ?? "Requete invalide.";
  if (status === 401) return mapping.unauthorized ?? "Session expiree. Veuillez vous reconnecter.";
  if (status === 403) return mapping.forbidden ?? "Acces refuse pour cette action.";
  if (status === 404) return mapping.notFound ?? "Ressource introuvable.";

  if (error?.code === "ECONNABORTED" || error?.message?.includes("timed out")) {
    return mapping.timeout ?? "Le serveur met trop de temps a repondre.";
  }

  if (
    error?.message?.includes("Network Error") ||
    error?.message?.includes("network request failed")
  ) {
    return mapping.network ?? "Connexion au serveur impossible.";
  }

  if (typeof backendMessage === "string" && backendMessage.trim()) {
    return backendMessage;
  }

  return mapping.fallback ?? "Erreur reseau ou serveur.";
}
