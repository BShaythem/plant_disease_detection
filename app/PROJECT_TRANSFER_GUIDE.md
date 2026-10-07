# OliveCare Mobile Frontend: Architecture & Migration Guide

This document provides a comprehensive technical breakdown of the **OliveCare-FRONT** repository and precise, step-by-step instructions for an AI assistant or software engineer to inspect, extract, and migrate this frontend into another project (specifically where the frontend or its routing is situated in an `app` folder).

---

## 1. Project Overview & Technical Stack

- **Application Type**: Cross-platform mobile app (iOS, Android, Web) for olive tree disease diagnosis, orchard health tracking, and agronomy advice.
- **Core Framework**: React Native `0.86.3` via **Expo SDK 57** (`~57.0.27`).
- **React Version**: React `19.2.3` / React DOM `19.2.3`.
- **Navigation System**: **Expo Router ~57.0.25** (File-based routing located under `src/app/`).
- **Language**: TypeScript (`~6.0.3`) in strict mode.
- **Local Persistence**:
  - `@react-native-async-storage/async-storage` for JSON key-value data (user profile, diagnosis history).
  - `expo-file-system/legacy` for sandboxed persistent photo storage in the device's document directory (`olive_scans/`).
- **Hardware Integrations**:
  - `expo-image-picker` for camera capture and photo gallery picking.
  - `expo-camera` for camera support.
- **Styling**: Vanilla React Native `StyleSheet` driven by a unified token design system ([constants/theme.ts](file:///c:/projects/OliveCare-FRONT/constants/theme.ts)).

---

## 2. Exhaustive File-by-File Breakdown

### 2.1 Root Configuration & Metadata Files

| Path | Purpose & Technical Role |
| :--- | :--- |
| `package.json` | Defines metadata, run scripts (`start`, `android`, `ios`, `web`), entry point (`"main": "expo-router/entry"`), and dependencies for Expo SDK 57, React 19, Expo Router, and vector icons. |
| `package-lock.json` | Locked dependency tree ensuring deterministic dependency installation across environments. |
| `app.json` | Expo application manifest. Defines app name ("Olive Care"), slug (`Olive_care`), URL scheme (`olivecare`), icons, splash screen, orientation (portrait), and required config plugins (`expo-router`, `expo-font`, `expo-splash-screen`). |
| `tsconfig.json` | TypeScript configuration extending `expo/tsconfig.base` with `strict: true`. |
| `.gitignore` | Prevents build artifacts (`node_modules/`, `.expo/`, `dist/`, `web-build/`, `ios/`, `android/`) and local configs from being committed. |
| `.npmrc` | Contains `legacy-peer-deps=true`. **Critical**: Required because React 19 peer-dependency declarations across some React Native libraries can cause npm install conflicts without this flag. |
| `AGENTS.md` | Context and guidelines for Expo SDK 57, EAS building, and Expo Router standards. |
| `LICENSE` | MIT License file. |
| `constants/theme.ts` | The core design system token file. Defines the agricultural olive green color palette, cream backgrounds, gold accents, status indicators, typography scales, spacing, border radii, shadows, and gradient tuples for `expo-linear-gradient`. |

---

### 2.2 Shared Modules (`src/`)

#### Constants & Types
- **`src/constants/theme.ts`**: Re-exports all design tokens from the root `constants/theme.ts` so components in `src/` can import cleanly from either location.
- **`src/types/index.ts`**: Contains data models used across all screens:
  - `ScanResult`: Stores diagnosis records (disease name, scientific name, confidence score, status `healthy|infected|warning`, severity, timestamps, notes, symptoms, treatments, preventive measures, and local image URI).
  - `NewsArticle`: Agronomic articles, tips, and phytosanitary warnings.
  - `UserProfile`: Grower credentials, orchard name, region, olive tree count, and avatar URI.

#### Core Components
- **`src/components/LeafImage.tsx`**:
  - Universal image rendering component.
  - Resolves static bundled assets (`sample1` through `sample6` from `assets/samples/`) via static `require()` statements.
  - Falls back gracefully to `FALLBACK_IMAGE` with a golden leaf badge overlay if an image path is invalid or fails to load.
  - Handles external `http://`, `https://`, and local `file://` URIs seamlessly.

#### Storage & Mock Data Utilities
- **`src/utils/mockData.ts`**:
  - `MOCK_DISEASES`: In-depth scientific pathology data covering Olive Peacock Spot (*Spilocaea oleagina*), Olive Knot Disease (*Pseudomonas savastanoi*), Verticillium Wilt (*Verticillium dahliae*), Olive Anthracnose (*Colletotrichum gloeosporioides*), Leaf Chlorosis/Mineral Deficiency, and Healthy Olive Foliage.
  - `MOCK_INITIAL_HISTORY`: Seed records to populate the history on fresh installs.
  - `MOCK_NEWS`: Curated agronomic news items with categories like Crop Protection, Water Conservation, and AI Technology.
  - `MOCK_USER_PROFILE`: Default farmer profile.
- **`src/utils/historyStorage.ts`**:
  - Storage key: `@olive_care_scan_history_v2`.
  - `persistScanImage(sourceUri)`: Copies temporary photos from cache/picker into a persistent directory (`${FileSystem.documentDirectory}olive_scans/`) so photos remain intact across sessions.
  - Full CRUD operations: `getScanHistory()`, `getScanById(id)`, `saveScanResult(result)`, `updateScanResult(id, updates)`, `deleteScanResult(id)` (which also unlinks the stored file), and `clearAllHistory()`.
- **`src/utils/profileStorage.ts`**:
  - Storage key: `@olive_care_user_profile_v1`.
  - Provides `getUserProfile()` and `saveUserProfile(profile)` using `AsyncStorage`.

---

### 2.3 Navigation & Screens (`src/app/`)

This project uses **Expo Router** with file-based routing:

#### Root Stack Navigator & Launch Screen
- **`src/app/_layout.tsx`**:
  - Root layout component wrapping the app in `SafeAreaProvider` and `StatusBar`.
  - Configures the top-level `Stack` navigator with screen animation presets and card presentations.
- **`src/app/index.tsx`**:
  - Launch splash screen with animated fade-in, scale, and glowing olive leaf badge.
  - Automatically transitions to `/(tabs)/home` after 2.5 seconds using `router.replace('/(tabs)/home')`.

#### Bottom Tab Navigator (`src/app/(tabs)/`)
- **`src/app/(tabs)/_layout.tsx`**:
  - Defines the 4-tab bottom navigation bar (`Tabs`) with icons from `@expo/vector-icons` (`MaterialCommunityIcons`, `Ionicons`):
    - `home`: Sprout icon.
    - `news`: Newspaper icon.
    - `history`: Clock/clipboard icon.
    - `account`: Person profile icon.
- **`src/app/(tabs)/home.tsx`**:
  - Main grower dashboard.
  - Displays orchard overview statistics (total scans, healthy trees, treatments active).
  - Quick actions: **Take Leaf Photo** (opens camera via `ImagePicker`), **Upload Photo** (opens gallery), and **Sample Leaves** selector (for testing without a camera).
  - Previews recent scans and seasonal orchard recommendations.
- **`src/app/(tabs)/news.tsx`**:
  - Agronomy knowledge feed with filterable category chips (*All*, *Crop Protection*, *Water Conservation*, *Organic Farming*, *AI Technology*).
  - Article reading modal with detailed agronomic guides.
- **`src/app/(tabs)/history.tsx`**:
  - History log of all past diagnoses.
  - Filter by disease status (*All*, *Infected*, *Healthy*).
  - Pull-to-refresh (`RefreshControl`), card deletion with confirmation alert, and click-through navigation to `history-detail`.
- **`src/app/(tabs)/account.tsx`**:
  - Farmer profile screen with orchard statistics, farm size, tree count, and app diagnostics.
  - Links to sub-screens: `edit-profile`, `my-scans`, `diagnostic-settings`, `supported-diseases`, and `agronomy-support`.

#### Dedicated Sub-Screens
- **`src/app/scanner.tsx`**:
  - The core diagnostic screen. Accepts `{ imageUri, source }` query params.
  - Displays a laser scan line animation across the leaf photo simulating neural network inference.
  - Step-by-step progress indicator ("Analyzing leaf geometry...", "Evaluating foliar lesion patterns...", etc.).
  - Renders diagnostic results: confidence bar, severity badges, scientific classification, pathogen descriptions, actionable treatments, and preventive measures.
  - Allows entering custom field notes and saving to `historyStorage`.
- **`src/app/history-detail.tsx`**:
  - Comprehensive inspection of an existing saved diagnosis.
  - Edit modal to update the disease label or grower field notes.
  - Delete action to remove the entry and delete its photo from disk.
- **`src/app/my-scans.tsx`**:
  - Visual analytics screen: percentage of healthy vs diseased trees, distribution breakdown of identified pathogens, and monitoring alerts.
- **`src/app/edit-profile.tsx`**:
  - Profile modification form: update name, email, farm name, region, and pick a custom profile picture using `ImagePicker`.
- **`src/app/diagnostic-settings.tsx`**:
  - Diagnostic preferences: toggle high-resolution capture, auto-save to history, offline AI model preference, confidence threshold selector, and detection cache reset.
- **`src/app/supported-diseases.tsx`**:
  - Botanical pathogen catalog: detailed encyclopedia cards for all detectable olive conditions with sample imagery, typical symptoms, and causal agents.
- **`src/app/agronomy-support.tsx`**:
  - Extension service directory: emergency plant pathology contacts, regional olive extension offices, and laboratory submission guidelines.

---

### 2.4 Assets (`assets/`)

- **`assets/icon.png`**, **`assets/splash-icon.png`**, **`assets/favicon.png`**: Primary application icons referenced by `app.json`.
- **`assets/images/`**: High-resolution icon and splash images for adaptive Android and iOS icons.
- **`assets/samples/`** (`sample1.jpg` – `sample6.jpg`): High-quality real olive leaf sample images representing Peacock Spot, Olive Knot, Verticillium, Anthracnose, Chlorosis, and Healthy leaves. Statically imported by `LeafImage.tsx`.

---

## 3. Migration Scenarios & Step-by-Step Instructions

Depending on how your destination project is structured, choose **Scenario A** or **Scenario B**.

---

### SCENARIO A: Transferring as a Standalone Subfolder `app/` (Monorepo or Full-Stack)

Use this scenario if your destination project has multiple services (e.g., `backend/` and `app/`), where `app/` is the complete mobile frontend.

```text
your-destination-project/
├── backend/
└── app/                    <-- This frontend will live here
    ├── assets/
    ├── constants/
    ├── src/
    ├── .npmrc
    ├── app.json
    ├── package.json
    ├── tsconfig.json
    └── AGENTS.md
```

#### Step 1: Copy Files
Copy the entire contents of this repository into `your-destination-project/app/`.

**DO NOT COPY**:
- `node_modules/`
- `.expo/`
- `.git/`
- `ios/` or `android/` (if present)

#### Step 2: Ensure `.npmrc` is Included
Make sure `your-destination-project/app/.npmrc` contains:
```ini
legacy-peer-deps=true
```
This is essential for React 19 dependency resolution.

#### Step 3: Install Dependencies
Open a terminal in the destination directory:
```bash
cd your-destination-project/app
npm install
```
*(If the parent project uses Bun, run `bun install`)*.

#### Step 4: Verify `app.json` Asset Paths
Check `your-destination-project/app/app.json`:
All asset paths (e.g., `./assets/images/icon.png`) are relative to `app.json` and will work without modifications.

#### Step 5: Test Execution
```bash
npx expo start
```

---

### SCENARIO B: Merging/Flattening Routes into an Existing Expo Project's `app/` Folder

Use this scenario if your destination project is already an Expo Router application where navigation files reside directly in `app/` (e.g. `app/(tabs)/`, `app/_layout.tsx`) instead of `src/app/`.

#### Step 1: Destination Folder Structure
Place the non-route code in standard shared folders and the screens in `app/`:
```text
your-destination-project/
├── app/                        <-- Expo Router directory
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── home.tsx
│   │   ├── news.tsx
│   │   ├── history.tsx
│   │   └── account.tsx
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── scanner.tsx
│   ├── history-detail.tsx
│   ├── my-scans.tsx
│   ├── edit-profile.tsx
│   ├── diagnostic-settings.tsx
│   ├── supported-diseases.tsx
│   └── agronomy-support.tsx
├── components/
│   └── LeafImage.tsx           <-- From src/components/
├── constants/
│   └── theme.ts                <-- From constants/theme.ts
├── types/
│   └── index.ts                <-- From src/types/
├── utils/
│   ├── historyStorage.ts       <-- From src/utils/
│   ├── mockData.ts
│   └── profileStorage.ts
└── assets/
    └── samples/                <-- Copy sample1.jpg - sample6.jpg here
```

#### Step 2: Set Up Path Aliases in `tsconfig.json` (Prevents Broken Imports)
Moving files out of `src/app/` into root `app/` alters relative depth (e.g., `../../constants/theme` becomes `../constants/theme`).

To prevent broken relative import errors, configure path aliases in `tsconfig.json`:
```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

#### Step 3: Fix Static Asset Imports in `LeafImage.tsx`
`LeafImage.tsx` uses static `require()` calls to load sample leaf images:
```typescript
// If components/ is at root level and assets/ is at root level:
export const SAMPLE_ASSETS: Record<string, any> = {
  sample1: require('../assets/samples/sample1.jpg'),
  sample2: require('../assets/samples/sample2.jpg'),
  sample3: require('../assets/samples/sample3.jpg'),
  sample4: require('../assets/samples/sample4.jpg'),
  sample5: require('../assets/samples/sample5.jpg'),
  sample6: require('../assets/samples/sample6.jpg'),
};
```
Ensure the relative path in `require()` points directly to the `assets/samples/` folder.

#### Step 4: Merge Dependencies into Destination `package.json`
Ensure your destination `package.json` contains these essential packages:
```bash
npx expo install @react-native-async-storage/async-storage expo-camera expo-constants expo-file-system expo-font expo-image-picker expo-linear-gradient expo-linking expo-router expo-splash-screen expo-status-bar react-native-safe-area-context react-native-screens react-native-web @expo/vector-icons
```
*(Always use `npx expo install` so Expo automatically selects packages matching your destination SDK version).*

---

## 4. Critical Gotchas & Error Prevention Checklist

| Potential Issue | Cause | Prevention & Solution |
| :--- | :--- | :--- |
| **`ERESOLVE unable to resolve dependency tree`** | React 19 peer-dependency mismatch with older packages. | Always ensure `.npmrc` has `legacy-peer-deps=true` or install with `--legacy-peer-deps`. |
| **`Unable to resolve module .../assets/samples/sample1.jpg`** | Metro bundler analyzes `require()` calls at compile time; if the relative path changes, Metro crashes. | Verify the relative path inside `LeafImage.tsx` matches the new location of `assets/samples/`. |
| **`Uncaught Error: Cannot find native module 'ExpoFileSystem'`** | `expo-file-system/legacy` was imported without installing the native module. | Run `npx expo install expo-file-system`. |
| **Camera/Gallery Crash on Real Devices** | Missing permission descriptions in `app.json` on iOS/Android. | Ensure `app.json` contains camera & media library plugins/permissions before building with EAS. |
| **Navigation Route Mismatches** | Changing screen filenames changes Expo Router paths. | All `router.push()` calls refer to routes by filename (e.g., `/scanner`, `/history-detail`, `/(tabs)/home`). Keep filenames identical. |
| **TypeScript Path Errors** | `Cannot find module '@/constants/theme'` | Make sure your destination `tsconfig.json` has `baseUrl: "."` and `paths: { "@/*": ["./*"] }`. Restart the TypeScript server after changing `tsconfig.json`. |

---

## 5. Verification Steps for the AI Assistant / Developer

After performing the transfer, execute these commands inside the target frontend folder to verify stability:

1. **Type Check**:
   ```bash
   npx tsc --noEmit
   ```
   *Expected: Zero errors.*

2. **Expo Diagnostic Doctor**:
   ```bash
   npx expo-doctor
   ```
   *Expected: All checks pass (no mismatched package versions).*

3. **Start Bundler with Cache Cleared**:
   ```bash
   npx expo start -c
   ```
   *Expected: Metro starts without bundling or unresolved module errors.*
