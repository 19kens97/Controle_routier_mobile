# Controle Routier Mobile

Application Expo/React Native pour les agents de controle routier.

## 1. Vue d'ensemble

Fonctions principales:
- Authentification JWT (login, logout, refresh auto, reset/changement mot de passe).
- Dashboard accueil.
- Ecran scan plaque (camera/galerie + OCR backend).
- Ecran documents:
  - recherche document classique (permis, carte vehicule, assurance, immatriculation),
  - nouveau mode `Dossier plaque` avec resume simplifie,
  - affichage de sections ciblees (`vehicle`, `documents`, `tickets`).
- Ecran stats.
- Profil et parametres.

## 2. Stack technique

- Expo `~54.0.32`
- React Native `0.81.5`
- React `19.1.0`
- TypeScript `~5.9.2`
- Expo Router `~6.0.22`
- Axios `^1.13.5`
- `expo-secure-store`
- `@react-native-async-storage/async-storage`
- `expo-image-picker`
- `expo-image-manipulator`
- `expo-notifications`
- Jest + Testing Library

## 3. Installation et lancement

```bash
npm install
npm run start
```

Autres cibles:
```bash
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

## 4. Configuration API

Fichier: `src/config/api.ts`

`API_BASE_URL` est resolu dans cet ordre:
1. `EXPO_PUBLIC_API_BASE_URL`
2. IP Expo detectee
3. fallback local

Exemple:
```bash
EXPO_PUBLIC_API_BASE_URL=http://<IP_BACKEND>:8000/api/
```

## 5. Architecture rapide

- `app/`: routes Expo Router.
- `src/api/`: appels backend.
- `src/providers/`: theme/providers globaux.
- `src/storage/`: persistance settings.
- `tests/`: tests UI et utilitaires.

## 6. Pages principales

### `app/login.tsx`
- Login utilisateur.
- API: `POST users/login/`.

### `app/scan-plate.tsx`
- Capture image (camera/galerie), optimisation locale, scan OCR backend.
- APIs:
  - `POST vehicles/scan-plate/`
  - `GET vehicles/search/?plate_number=...`
  - details document via endpoints documents.

### `app/(tabs)/documents.tsx`
- Recherche documentaire.
- Modes:
  - `Permis`
  - `Carte vehicule`
  - `Assurance`
  - `Immatriculation`
  - `Dossier plaque` (nouveau)

#### Mode `Dossier plaque` (nouveau)
- entree: numero d'immatriculation
- API: `GET vehicles/dossier/?plate_number=...&section=...`
- affiche:
  - `overview` simplifie (documents ok, tickets en cours/regles, etc.)
  - possibilite de charger specifiquement:
    - `all`
    - `vehicle`
    - `documents`
    - `tickets`

### `app/(tabs)/index.tsx`
- Dashboard accueil.
- APIs: `GET users/profile/`, `GET stats/home-dashboard/`.

### `app/(tabs)/stats.tsx`
- Stats detaillees.
- API: `GET stats/dashboard/`.

### `app/(tabs)/profile.tsx`
- Profil utilisateur + edition partielle.

### `app/(tabs)/settings.tsx`
- Preferences locales + securite + logout.

## 7. Couche API mobile

### `src/api/api.ts`
- Axios client commun:
  - injecte bearer token
  - retire `Content-Type` si `FormData`
  - refresh token automatique en cas de `401`

### `src/api/vehicles.api.ts`
- `scanVehiclePlate(imageUri, engine)`
- `searchVehicleByPlate(plateNumber)`

### `src/api/documents.api.ts`
- `searchDriverLicense(license_number)`
- `searchVehicleCard(card_number)`
- `searchVehicleInsurance(policy_number)`
- `getVehicleRegistrationByCode(registration_code)`
- `getVehicleDossierByPlate(plate_number, section)` (nouveau)

## 8. Stockage local

### SecureStore
- `access_token`
- `refresh_token`

### AsyncStorage
- Cle: `cr_app_settings_v1`
- contient les preferences UI/app.

## 9. Permissions

- Camera/galerie: `expo-image-picker`
- Notifications: `expo-notifications`

Si permission refusee, l'app propose l'ouverture des parametres systeme.

## 10. Scripts npm

- `npm run start`
- `npm run android`
- `npm run ios`
- `npm run web`
- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run test:watch`

## 11. Tests

Exemples presents:
- `tests/login.test.tsx`
- `tests/settings.test.tsx`
- `tests/scan-plate.test.tsx`
- `src/storage/settings.storage.test.ts`
- `src/utils/authEvents.test.ts`

## 12. Notes importantes

- Le mobile consomme un backend mixant parfois reponses wrappees et non wrappees.
- Le workflow scan et le mode dossier plaque sont complementaires:
  - scan pour detecter la plaque,
  - dossier plaque pour la vue metier simplifiee et les sections detaillees.
