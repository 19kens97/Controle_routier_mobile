# Controle Routier Mobile

Application mobile Expo/React Native pour les agents de controle routier.

## Sommaire
1. Vue d'ensemble
2. Stack technique
3. Installation et lancement
4. Configuration API
5. Navigation et pages (entree/sortie)
6. Couche API mobile (entree/sortie)
7. Stockage local
8. Permissions (camera/galerie/notifications)
9. Scripts et tests
10. Limitations connues

## Vue d'ensemble

Fonctionnalites principales:
- Authentification JWT (login, logout, reset password, change password).
- Dashboard accueil (profil + stats simplifiees + alertes + activite).
- Recherche documents (permis, carte vehicule, assurance, immatriculation).
- Scan OCR plaque:
  - prise photo/galerie,
  - extraction plaque,
  - recherche vehicule associe,
  - affichage des numeros documents associes,
  - affichage detail document au clic.
- Ecran statistiques (source backend avec fallback mock).
- Ecran profil (consultation + edition partielle).
- Ecran parametres (theme, texte, notif, offline, securite locale).

## Stack technique

- Expo `~54.0.32`
- React Native `0.81.5`
- React `19.1.0`
- TypeScript `~5.9.2`
- Expo Router `~6.0.22`
- Axios `^1.13.5`
- Secure storage: `expo-secure-store`
- Local settings: `@react-native-async-storage/async-storage`
- Camera/galerie: `expo-image-picker`
- Notifications: `expo-notifications`
- Tests: Jest + `@testing-library/react-native`

## Installation et lancement

Prerequis:
- Node.js LTS
- npm
- Backend Django accessible depuis appareil/emulateur

Installation:
```bash
npm install
```

Lancement:
```bash
npm run start
npm run android
npm run ios
npm run web
```

Verification:
```bash
npm run lint
npm run typecheck
npm test
```

## Configuration API

Fichier de config: `src/config/api.ts`

Priorite de resolution de `API_BASE_URL`:
1. `EXPO_PUBLIC_API_BASE_URL` si definie.
2. IP Expo detectee automatiquement (`http://<expo-host-ip>:8000/api/`).
3. Fallback hardcode: `http://192.168.0.110:8000/api/`.

Variable a definir recommandee:
```bash
EXPO_PUBLIC_API_BASE_URL=http://<IP_BACKEND>:8000/api/
```

## Navigation et pages (entree/sortie)

### Route `app/index.tsx`
- Role: gate d'authentification.
- Entree:
  - lit `access_token` local via `isAuthenticated()`.
- Sortie:
  - redirige vers `/(tabs)` si token existe.
  - redirige vers `/login` sinon.

### Route `app/login.tsx`
- Role: connexion.
- Entree UI:
  - `username` (string)
  - `password` (string)
- API appelee:
  - `POST users/login/`
- Sortie UI:
  - succes: sauvegarde `access_token` + `refresh_token`, navigation `/(tabs)`.
  - erreur: message affiche.

### Route `app/forgot-password.tsx`
- Role: demande de reset.
- Entree UI:
  - `email` (string)
- API appelee:
  - `POST users/password/reset/`
- Sortie UI:
  - succes: message de confirmation.
  - erreur: message erreur.

### Route `app/reset-password.tsx`
- Role: confirmation reset.
- Entree route params:
  - `uid` (query param)
  - `token` (query param)
- Entree UI:
  - `new_password`
  - `confirm_password`
- API appelee:
  - `POST users/password/reset/confirm/`
- Sortie UI:
  - succes: alerte + retour login.
  - erreur: message.

### Route `app/(tabs)/index.tsx` (Accueil)
- Role: dashboard accueil.
- APIs appelees:
  - `GET users/profile/`
  - `GET stats/home-dashboard/`
- Entree:
  - aucune saisie obligatoire.
- Sortie UI:
  - affiche infos agent, alertes, activite, stats resumee.
  - quick actions vers scan, documents, modal.

### Route `app/(tabs)/documents.tsx`
- Role: recherche multi-documents.
- Entree UI:
  - `docType` parmi `DRIVER_LICENSE | VEHICLE_CARD | VEHICLE_INSURANCE | VEHICLE_REGISTRATION`
  - `query` (numero/code)
- APIs appelees selon type:
  - `GET documents/driver-license/search?license_number=...`
  - `GET documents/vehicle-cards/search/?card_number=...`
  - `GET documents/vehicle-insurances/search/?policy_number=...`
  - `GET documents/registrations/{registration_code}/`
- Sortie UI:
  - affichage du document brut (key/value).
  - historique de recherches (session seulement).

### Route `app/scan-plate.tsx`
- Role: workflow scan complet.
- Entree UI:
  - source image: galerie ou camera.
  - confirmation/edition plaque detectee.
- APIs appelees:
  - `POST vehicles/scan-plate/` (multipart `image`, `engine=ai`)
  - `GET vehicles/search/?plate_number=...`
  - au clic sur document:
    - `GET documents/vehicle-cards/search/?card_number=...` ou
    - `GET documents/vehicle-insurances/search/?policy_number=...` ou
    - `GET documents/registrations/{registration_code}/`
- Sortie UI:
  - resultat OCR (`plate`, `confidence`, `candidates`, `raw_text`, `source`).
  - details vehicule associe.
  - liste cliquable:
    - numero carte vehicule,
    - numero carte d'assurance,
    - numero papier d'immatriculation.
  - details du document selectionne.

### Route `app/(tabs)/stats.tsx`
- Role: dashboard stats detaille.
- API appelee:
  - `GET stats/dashboard/`
- Sortie UI:
  - si succes: donnees live.
  - si echec: fallback `mockDashboardStats`.

### Route `app/(tabs)/profile.tsx`
- Role: consultation + edition profil.
- APIs appelees:
  - `GET users/profile/`
  - `PATCH users/profile/update/`
- Entree edition:
  - `first_name`, `last_name`, `email`
- Sortie UI:
  - profil mis a jour localement.

### Route `app/(tabs)/settings.tsx`
- Role: preferences + securite + support.
- APIs appelees:
  - `GET users/profile/`
  - `POST users/password/change/`
  - `POST users/logout/`
- Entree UI principale:
  - Theme, langue, taille texte, offline, sync policy, notifications.
  - changement mot de passe (`old_password`, `new_password`).
- Sortie UI:
  - preferences persistantes localement.
  - logout local/systeme.

### Route `app/modal.tsx`
- Role: ecran modal simple (placeholder).
- Entree:
  - aucune.
- Sortie:
  - message et bouton retour.

## Couche API mobile (entree/sortie)

### Client commun `src/api/api.ts`
- Base URL: `API_BASE_URL`.
- Timeout: `60000ms`.
- Interceptor request:
  - injecte `Authorization: Bearer <access_token>` si present.
  - retire `Content-Type` JSON pour `FormData`.
- Interceptor response:
  - en cas `401`, tente refresh via `POST users/token/refresh/`.
  - rejoue la requete originale si refresh OK.
  - purge tokens si refresh KO.

### `src/api/auth.api.ts`

#### `requestPasswordReset(email: string)`
- Entree:
```ts
email: string
```
- Sortie:
```ts
Promise<any> // backend response object
```

#### `changePassword(old_password: string, new_password: string)`
- Entree:
```ts
old_password: string
new_password: string
```
- Sortie:
```ts
Promise<any>
```

#### `logout(refresh: string)`
- Entree:
```ts
refresh: string
```
- Sortie:
```ts
Promise<any>
```

### `src/api/users.api.ts`

#### `getUserProfile()`
- Entree: aucune.
- Sortie:
```ts
Promise<{
  success?: boolean;
  message?: string;
  data: UserProfile;
}>
```

`UserProfile`:
```ts
{
  username: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  role: string;
  nif?: string | null;
  date_of_birth?: string | null;
  phone_number?: string | null;
}
```

#### `updateUserProfile(payload)`
- Entree:
```ts
Partial<{
  first_name: string;
  last_name: string;
  email: string;
}>
```
- Sortie:
```ts
Promise<{ message?: string; data?: Partial<UserProfile> }>
```

### `src/api/documents.api.ts`

#### `searchDriverLicense(license_number)`
- Entree:
```ts
license_number: string
```
- Sortie:
```ts
Promise<any> // objet permis (backend brut)
```

#### `searchVehicleCard(card_number)`
- Entree:
```ts
card_number: string
```
- Sortie:
```ts
Promise<any> // objet carte vehicule
```

#### `searchVehicleInsurance(policy_number)`
- Entree:
```ts
policy_number: string
```
- Sortie:
```ts
Promise<any> // objet assurance
```

#### `getVehicleRegistrationByCode(registration_code)`
- Entree:
```ts
registration_code: string
```
- Sortie:
```ts
Promise<any> // objet immatriculation
```

### `src/api/vehicles.api.ts`

Types exposes:
- `OcrEngine = "ai" | "tesseract"`
- `PlateScanData`
- `PlateScanResponse`
- `VehicleLookupData`
- `VehicleLookupResponse`

#### `scanVehiclePlate(imageUri, engine)`
- Entree:
```ts
imageUri: string
engine: "ai" | "tesseract"
```
- Sortie:
```ts
Promise<{
  data: {
    success: boolean;
    message: string;
    data: {
      plate: string | null;
      confidence: number;
      candidates: string[];
      raw_text: string;
      is_reliable: boolean;
      source: string;
    };
  };
}>
```

#### `searchVehicleByPlate(plateNumber)`
- Entree:
```ts
plateNumber: string // format attendu AA-12345
```
- Sortie:
```ts
Promise<{
  success: boolean;
  message: string;
  data: VehicleLookupData;
}>
```

### `src/api/home.api.ts`

#### `fetchHomeDashboard()`
- Entree: aucune.
- Sortie:
```ts
Promise<HomeDashboardData>
```

`HomeDashboardData`:
```ts
{
  sync: { online: boolean; pendingCount: number; lastUpdatedAt: string; };
  stats: { primaryLabel: string; primaryValue: string; secondaryLabel: string; secondaryValue: string; };
  alerts: { id: string; title: string; desc: string; level: "HIGH" | "MEDIUM"; }[];
  activity: { id: string; title: string; subtitle: string; status: "SUCCESS" | "WARNING" | "NEUTRAL"; }[];
}
```

### `src/api/stats.api.ts`

#### `fetchDashboardStats()`
- Entree: aucune.
- Sortie:
```ts
Promise<Omit<DashboardStats, "source">>
```

`DashboardStats` (vue UI):
```ts
{
  source: "live" | "mock";
  generatedAt: string;
  headline: string;
  subheadline: string;
  metrics: StatsMetric[];
  activity: { title: string; points: ActivityPoint[]; };
  infractions: { title: string; items: DistributionItem[]; };
  hotspots: { title: string; items: RankingItem[]; };
  agents: { title: string; items: RankingItem[]; };
  recentActivity: RecentActivityItem[];
  alerts: AlertItem[];
}
```

## Stockage local

### SecureStore
- `access_token`
- `refresh_token`

### AsyncStorage (`cr_app_settings_v1`)
Structure `AppSettings`:
- `themeMode`: `SYSTEM | DARK | LIGHT`
- `language`: `FR | HT`
- `textSize`: `SMALL | NORMAL | LARGE`
- `offlineMode`: `boolean`
- `syncPolicy`: `WIFI_ONLY | ALWAYS`
- `notifEnabled`: `boolean`
- `notifPriorityAlerts`: `boolean`
- `notifExpiredDocs`: `boolean`
- `notifEndShift`: `boolean`
- `maskSensitive`: `boolean`

## Permissions (camera/galerie/notifications)

### Camera et galerie
Utilise `expo-image-picker`.

Flux scan:
1. Demande permission camera/galerie.
2. Si refusee:
  - message d'erreur,
  - proposition d'ouverture des reglages (`Linking.openSettings()`).

### Notifications
Utilise `expo-notifications`.

Comportement settings:
- demande permission systeme si activation.
- si refuse, proposition d'ouverture des reglages.
- bouton notification de test.

## Scripts et tests

Scripts npm:
- `npm run start`
- `npm run android`
- `npm run ios`
- `npm run web`
- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run test:watch`

Tests presents:
- `tests/login.test.tsx`
- `tests/settings.test.tsx`
- `tests/scan-plate.test.tsx`
- `src/storage/settings.storage.test.ts`
- `src/utils/authEvents.test.ts`

## Limitations connues

- Contrat backend mixte (reponses wrappees + non wrappees), gere au cas par cas dans l'app.
- Certains textes UI ont encore des accents mal encodes.
- `modal.tsx` reste un placeholder.
- Quelques flux restent a completer cote backend (infractions/tickets).

