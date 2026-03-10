# Controle Routier Mobile

Application mobile React Native (Expo) pour les agents de controle routier.

Ce README decrit l'etat reel de la version mobile au **09 mars 2026**: ce qui est deja implemente, comment c'est structure, comment lancer/tester, et ce qui reste a finaliser.

## 1) Resume de la version mobile

### Deja realise
- Authentification complete (connexion, oubli de mot de passe, reinitialisation, deconnexion).
- Navigation principale par onglets (Accueil, Documents, Stats, Profil, Parametres).
- Tableau de bord agent avec profil, actions rapides, alertes et activite (donnees partiellement mockees).
- Recherche de documents backend (permis, carte vehicule, assurance, immatriculation).
- Ecran profil avec edition partielle (prenom, nom, email).
- Ecran parametres avec persistance locale (theme, langue, texte, notifications, offline, securite locale).
- Scan OCR de plaque a partir photo/galerie avec selection moteur (AI/Tesseract).
- Gestion permission camera/galerie dans le flux scan, avec redirection vers les parametres appareil en cas de refus.
- Couche API centralisee avec injection Bearer token + refresh automatique sur 401.
- Tests Jest principaux + pipeline CI (lint, typecheck, tests).

### Partiellement realise / placeholder
- Onglet `Stats` (ecran minimal).
- Plusieurs blocs du dashboard (alertes, activite, sync) sont actuellement locaux/mockes.
- Modal d'actions (`/modal`) encore simplifie.
- Verrouillage PIN/biometrie annonce mais non implemente.

## 2) Stack technique

- Expo `~54.0.32`
- React Native `0.81.5`
- React `19.1.0`
- TypeScript `~5.9.2`
- Expo Router `~6.0.22` (routing file-based)
- Axios `^1.13.5`
- Secure token storage: `expo-secure-store`
- Preferences storage: `@react-native-async-storage/async-storage`
- Image/camera: `expo-image-picker`
- Tests: Jest + `@testing-library/react-native`
- CI: GitHub Actions

## 3) Architecture du projet

```text
app/
  _layout.tsx
  index.tsx
  login.tsx
  forgot-password.tsx
  reset-password.tsx
  scan-plate.tsx
  modal.tsx
  (tabs)/
    _layout.tsx
    index.tsx
    documents.tsx
    stats.tsx
    profile.tsx
    settings.tsx

src/
  api/
    api.ts
    auth.api.ts
    users.api.ts
    documents.api.ts
    vehicles.api.ts
  config/
    api.ts
  storage/
    settings.storage.ts
  utils/
    auth.ts
    authEvents.ts

components/
  screen.tsx

constants/
  theme.ts

tests/
  login.test.tsx
  settings.test.tsx
  scan-plate.test.tsx
src/storage/settings.storage.test.ts
src/utils/authEvents.test.ts
```

## 4) Navigation et ecrans

### Racine
- `app/index.tsx`: gate de session, redirige vers `/(tabs)` si token present sinon `/login`.
- `app/_layout.tsx`: stack global sans header, `SafeAreaProvider` + `StatusBar`.

### Auth
- `app/login.tsx`
  - Form username/password.
  - `POST users/login/`.
  - Sauvegarde `access_token` + `refresh_token` en SecureStore.
  - Redirection vers `/(tabs)`.
- `app/forgot-password.tsx`
  - Form email.
  - `POST users/password/reset/`.
- `app/reset-password.tsx`
  - Utilise params `uid` + `token` (deep-link/router params).
  - `POST users/password/reset/confirm/` avec `new_password`.

### Onglets
- `/(tabs)/index.tsx` (Accueil)
  - Charge profil backend.
  - Affiche cards d'alertes/actions/stats/activite.
  - Certaines donnees sont actuellement mockees dans le composant.
- `/(tabs)/documents.tsx`
  - Recherche multi-type de document.
  - Historique de recherche en memoire (session uniquement).
- `/(tabs)/profile.tsx`
  - Lecture profil.
  - Edition `first_name`, `last_name`, `email`.
- `/(tabs)/settings.tsx`
  - Preferences locales + actions compte/securite/support.
  - Changement mot de passe + deconnexion.
- `/(tabs)/stats.tsx`
  - Ecran placeholder.

### Scan OCR plaque
- `app/scan-plate.tsx`
  - Selection moteur OCR: `ai` ou `tesseract`.
  - Choix image galerie ou prise photo camera.
  - Upload multipart vers backend scan.
  - Affichage resultat: plaque, confiance, fiabilite, candidats, texte brut.

## 5) Permissions mobile (camera/galerie)

Configuration dans `app.json`:
- Android:
  - `android.permission.CAMERA`
- iOS:
  - `NSCameraUsageDescription`
  - `NSPhotoLibraryUsageDescription`
- Plugin `expo-image-picker` avec messages de permission personnalises.

Comportement en scan:
- Appel de `requestCameraPermissionsAsync()` au clic `Prendre photo`.
- Si refuse:
  - message d'erreur affiche,
  - alerte proposant `Ouvrir parametres`,
  - `Linking.openSettings()` ouvre les reglages appareil.

## 6) API integree (etat actuel)

### Client API central (`src/api/api.ts`)
- Base URL depuis `EXPO_PUBLIC_API_BASE_URL`.
- Timeout 10s.
- Injection automatique `Authorization: Bearer <access_token>`.
- Gestion speciale FormData (suppression `Content-Type` JSON pour multipart).
- Refresh automatique sur 401 via `users/token/refresh/`.
- Protection anti-concurrence refresh (single refresh promise).
- Purge tokens locale si refresh echoue.

### Endpoints utilises

Authentification / compte:
- `POST users/login/`
- `POST users/token/refresh/`
- `POST users/logout/`
- `POST users/password/reset/`
- `POST users/password/change/`
- `POST users/password/reset/confirm/`
- `GET users/profile/`
- `PATCH users/profile/update/`

Documents:
- `GET documents/driver-license/search?license_number=...`
- `GET documents/vehicle-cards/search/?card_number=...`
- `GET documents/vehicle-insurances/search/?policy_number=...`
- `GET documents/registrations/{registration_code}/`

Scan plaque:
- `POST vehicles/scan-plate/` (multipart: `image`, `engine`)

## 7) Stockage local

### SecureStore
- `access_token`
- `refresh_token`

### AsyncStorage
- Cle: `cr_app_settings_v1`
- Valeurs:
  - `themeMode`: `SYSTEM | LIGHT | DARK`
  - `language`: `FR | HT`
  - `textSize`: `SMALL | NORMAL | LARGE`
  - `offlineMode`
  - `syncPolicy`: `WIFI_ONLY | ALWAYS`
  - `notifPriorityAlerts`, `notifExpiredDocs`, `notifEndShift`
  - `maskSensitive`

## 8) UI/Theme

- Composant `Screen` applique un fond gradient global + SafeArea.
- Tokens centralises dans `constants/theme.ts`:
  - couleurs surfaces/texte/accent,
  - radii,
  - spacing,
  - tailles typographiques.

## 9) Tests existants

### Tests ecran
- `tests/login.test.tsx`
  - connexion succes (save tokens + redirection)
  - message d'erreur backend
- `tests/settings.test.tsx`
  - rendu sections profil/preferences
  - sauvegarde changement langue
- `tests/scan-plate.test.tsx`
  - demande permission camera au clic `Prendre photo`
  - alerte vers reglages si permission refusee

### Tests utilitaires
- `src/storage/settings.storage.test.ts`
  - defaults, merge, JSON invalide, save, reset
- `src/utils/authEvents.test.ts`
  - subscribe / unsubscribe event auth

## 10) CI et qualite

Workflow: `.github/workflows/ci.yml`
- `npm ci`
- `npm run lint`
- `npm run typecheck`
- `npm test`

## 11) Installation et lancement

## Prerequis
- Node.js LTS
- npm
- Expo (via `npx expo`)
- Backend accessible depuis mobile/emulateur

## Setup
```bash
npm install
```

## Environnement
Creer `.env.local` (ou equivalent) avec:
```bash
EXPO_PUBLIC_API_BASE_URL=http://<IP_BACKEND>:8000/api/
```

Exemple fourni: `.env.example`.

## Run
```bash
npm run start
npm run android
npm run ios
npm run web
```

## Verification locale
```bash
npm run lint
npm run typecheck
npm test
```

## 12) Limitations connues

- Plusieurs textes UI contiennent des problemes d'encodage de caracteres accentues (a normaliser en UTF-8).
- Dashboard: partie donnees statiques/mockees.
- `Stats` non fonctionnel (placeholder).
- `modal.tsx` encore minimal.
- Pas encore de couverture tests sur tous les flux API/ecrans.

## 13) Roadmap recommandee

1. Finaliser les ecrans placeholders (`Stats`, `modal`, actions dashboard).
2. Uniformiser les reponses backend et messages d'erreur (contrats API).
3. Corriger/normaliser tous les textes FR encodes.
4. Ajouter couverture tests sur `documents`, `profile`, `api.ts` (refresh flow).
5. Ajouter verrouillage local (PIN/biometrie) et durcir les parcours securite.
6. Brancher une vraie synchronisation offline/online (file d'attente locale).

---

Projet: CompuConsult - Controle Routier Mobile
