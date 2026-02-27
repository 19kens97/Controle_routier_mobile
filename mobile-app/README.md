# Controle Routier Mobile

[![CI](https://github.com/OWNER/REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/OWNER/REPO/actions/workflows/ci.yml)

Application mobile React Native (Expo) pour les agents de controle routier.

L'app permet de:
- s'authentifier,
- consulter un tableau de bord agent,
- rechercher des documents (permis, carte vehicule, assurance, immatriculation),
- consulter/modifier le profil,
- gerer les parametres (preferences, notifications, securite locale),
- gerer les flux mot de passe oublie / reinitialisation.

## Sommaire

- [Fonctionnalites](#fonctionnalites)
- [Stack technique](#stack-technique)
- [Structure du projet](#structure-du-projet)
- [Prerequis](#prerequis)
- [Installation et lancement](#installation-et-lancement)
- [Configuration API](#configuration-api)
- [Authentification](#authentification)
- [Stockage local](#stockage-local)
- [Scripts npm](#scripts-npm)
- [Qualite et lint](#qualite-et-lint)
- [Tests et CI](#tests-et-ci)
- [Roadmap](#roadmap)
- [Depannage](#depannage)

## Fonctionnalites

### Authentification
- Ecran de connexion (`/login`)
- Mot de passe oublie (`/forgot-password`)
- Reinitialisation mot de passe (`/reset-password`)
- Redirection automatique selon session (`/`)

### Navigation principale (tabs)
- `Accueil` (`/(tabs)`): resume profil, alertes, actions rapides, activite recente
- `Documents` (`/(tabs)/documents`): recherche par type de document
- `Stats` (`/(tabs)/stats`): ecran present (contenu minimal pour l'instant)
- `Profil` (`/(tabs)/profile`): consultation et edition des infos utilisateur
- `Parametres` (`/(tabs)/settings`): preferences, sync locale, notifications, securite, deconnexion

### Documents supportes
- Permis (`DRIVER_LICENSE`)
- Carte vehicule (`VEHICLE_CARD`)
- Assurance vehicule (`VEHICLE_INSURANCE`)
- Immatriculation (`VEHICLE_REGISTRATION`)

## Stack technique

- **Framework mobile**: Expo + React Native
- **Langage**: TypeScript (strict mode)
- **Routing**: Expo Router (file-based routing)
- **HTTP client**: Axios
- **Stockage securise tokens**: `expo-secure-store`
- **Stockage preferences**: `@react-native-async-storage/async-storage`
- **UI/UX**: composants React Native + theme custom (`constants/theme.ts`)
- **Lint**: ESLint via `expo lint`

## Structure du projet

```text
app/
  _layout.tsx
  index.tsx
  login.tsx
  forgot-password.tsx
  reset-password.tsx
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
  storage/
    settings.storage.ts
  utils/
    auth.ts
    authEvents.ts

components/
constants/
assets/
```

## Prerequis

- Node.js LTS
- npm
- Expo CLI (via `npx expo`)
- Emulateur Android/iOS ou Expo Go
- Backend API accessible depuis l'appareil/emulateur

## Installation et lancement

1. Installer les dependances:

```bash
npm install
```

2. Demarrer le serveur Expo:

```bash
npm run start
```

3. Lancer selon la cible:

```bash
npm run android
npm run ios
npm run web
```

## Configuration API

L'URL API est configuree via variable d'environnement Expo:

```bash
EXPO_PUBLIC_API_BASE_URL=http://192.168.0.110:8000/api/
```

Un exemple est fourni dans `.env.example`.
Copie-le vers `.env.local` et adapte la valeur selon ton environnement.

### Important
- Adapte cette URL a ton environnement (IP locale, staging, production).
- En production, privilegie HTTPS.
- Idealement, centraliser la configuration d'environnement (dev/staging/prod).

## Authentification

- Login: `POST users/login/`
- Refresh token: `POST users/token/refresh/`
- Logout: `POST users/logout/`
- Profil: `GET users/profile/`

Le client Axios ajoute automatiquement le bearer token via interceptor.
En cas de `401`, un mecanisme de refresh tente de regenerer l'access token puis rejoue la requete.

## Stockage local

- **SecureStore**
  - `access_token`
  - `refresh_token`

- **AsyncStorage**
  - `cr_app_settings_v1` (preferences app)

## Scripts npm

- `npm run start`: lance Expo
- `npm run android`: ouvre Android
- `npm run ios`: ouvre iOS
- `npm run web`: ouvre Web
- `npm run lint`: lance ESLint
- `npm run typecheck`: verification TypeScript sans emission
- `npm test`: execute la suite de tests Jest
- `npm run test:watch`: execute les tests en mode watch
- `npm run reset-project`: script Expo de reset du projet

## Qualite et lint

Lancer:

```bash
npm run lint
```

Le lint est actif sur le projet. Corriger les erreurs/warnings avant release.

## Tests et CI

### Tests locaux

```bash
npm run lint
npm run typecheck
npm test
```

### CI GitHub Actions

Workflow present dans:
- `.github/workflows/ci.yml`

Le pipeline execute:
- installation (`npm ci`)
- lint
- typecheck
- tests

### Badge CI

Le badge en haut du README utilise `OWNER/REPO` comme placeholder.
Remplace `OWNER/REPO` par le chemin reel de ton repository GitHub.

## Roadmap

- Finaliser l'ecran `Stats`
- Brancher les actions rapides du dashboard aux vrais modules
- Ajouter un module de synchronisation offline/online complet
- Ajouter verrouillage PIN/biometrie
- Introduire tests unitaires/integration
- Centraliser la config d'environnement API
- Completer la documentation backend/contrats API

## Depannage

### L'app ne se connecte pas au backend
- Verifier l'IP/port API configures
- Verifier que le mobile/emulateur est sur le meme reseau
- Verifier les routes backend (`/api/...`)

### Erreurs 401 frequentes
- Verifier le format des tokens renvoyes par le backend
- Verifier la route de refresh
- Reconnecter l'utilisateur (purge SecureStore)

### Ecran blanc au demarrage
- Verifier les logs Expo
- Verifier la redirection dans `app/index.tsx`
- Verifier la presence des tokens si l'utilisateur est considere authentifie

---

## Auteur / Equipe

Projet interne CompuConsult - Controle Routier Mobile.

Si besoin, je peux aussi te generer une version `README` orientee utilisateur final (non technique) en plus de celle-ci.
