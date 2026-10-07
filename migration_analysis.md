# Frontend Migration Analysis & Gap Report

## Migration Status: ✅ Complete (Scenario A)

Files from `my colleague work/` have been copied into [app/](file:///c:/projects/plant_disease_detection/app) following **Scenario A** from the transfer guide (standalone subfolder). TypeScript compiles with **zero errors**. The stale `App.tsx` and `index.ts` from a previous Expo init attempt have been removed.

---

## What's Working Well

| Aspect | Status | Details |
|---|---|:---:|
| File structure | ✅ | All screens, components, utils, types, assets properly placed |
| TypeScript strict mode | ✅ | `npx tsc --noEmit` passes with 0 errors |
| `.npmrc` (React 19 fix) | ✅ | `legacy-peer-deps=true` present |
| Expo Router file-based routing | ✅ | `src/app/` with tabs, sub-screens, `_layout.tsx` |
| Design system | ✅ | Olive/agricultural color palette, spacing tokens, typography |
| Camera & gallery capture | ✅ | `expo-image-picker` with proper permissions flow |
| Image persistence | ✅ | `expo-file-system/legacy` copies images to document directory |
| `metro.config.js` | ✅ | Includes `.onnx`, `.onnx.data`, `.gguf`, `.db` asset extensions |
| Sample leaf images | ✅ | 6 real olive leaf samples bundled in `assets/samples/` |

---

## Critical Gaps vs. Architecture Spec

These are the areas where the frontend **does not yet implement** what [ARCHITECTURE.md](file:///c:/projects/plant_disease_detection/docs/ARCHITECTURE.md) specifies. They are expected — the colleague built the UI shell, you and the team need to wire in the AI backend.

### 1. 🔴 Vision Inference is Fully Mocked

**Current**: [scanner.tsx](file:///c:/projects/plant_disease_detection/app/src/app/scanner.tsx#L107-L153) picks a random disease from `MOCK_DISEASES` after a 2.4s timer animation.

**Required**: Run [MobileNetV4-conv-small ONNX model](file:///c:/projects/plant_disease_detection/models/vision/mobilenetv4_conv_small_fp32.onnx) via `onnxruntime-react-native`. This package is **not installed yet**.

**What needs to change**:
- Install: `npx expo install onnxruntime-react-native`
- Replace the mock `setTimeout` block in `scanner.tsx` with real ONNX inference
- Preprocessing must match training: resize to 224×224, normalize with ImageNet mean/std, RGB channel order
- Map output index → `class_label` using [labels.json](file:///c:/projects/plant_disease_detection/models/vision/labels.json) (`["aculus_olive", "olivepeacockspot"]`)

### 2. 🔴 No Chat Interface (Tier 1 + Tier 2 RAG)

**Current**: No chat screen exists. After diagnosis, the user sees static treatment/symptom text from mock data.

**Required per architecture**: A grounded chat where the farmer can ask follow-up questions, powered by:
- `llama.rn` (GGUF SLM) for text generation
- Disease card from `knowledge.db` always in context (Tier 1)
- RAG corpus chunks retrieved when similarity score exceeds threshold (Tier 2)

**What needs to change**:
- Install: `llama.rn` (or `@pocketpalai/llama.rn`)
- Create a new screen `src/app/chat.tsx` with a chat UI (the architecture spec mentions `react-native-gifted-chat`)
- Wire it to be navigable from the scanner results screen after a diagnosis

### 3. 🔴 No SQLite Integration (`expo-sqlite`)

**Current**: All persistence uses `AsyncStorage` (JSON key-value) for scan history and user profiles.

**Required per [SCHEMA.md](file:///c:/projects/plant_disease_detection/docs/SCHEMA.md)**:
- `knowledge.db`: Read-only bundled asset (diseases, disease_docs, chunks, embeddings)
- `app.db`: Read-write on-device (sessions, images, diagnoses, messages, message_sources)

**What needs to change**:
- Install: `npx expo install expo-sqlite`
- Replace `AsyncStorage`-based history with proper SQLite tables (`sessions`, `images`, `diagnoses`, `messages`)
- Load `knowledge.db` from bundled assets at startup
- Check `meta.embedding_dim` at startup to validate model compatibility

### 4. 🟡 Data Model Mismatch (`ScanResult` vs `app.db` Schema)

**Current** [ScanResult](file:///c:/projects/plant_disease_detection/app/src/types/index.ts#L1-L15) type:
```typescript
interface ScanResult {
  id: string;
  diseaseName: string;        // human-readable name
  scientificName: string;
  confidence: number;         // e.g. 94.8
  status: 'healthy' | 'infected' | 'warning';
  severity: 'None' | 'Low' | 'Moderate' | 'High';
  symptoms: string[];
  recommendedTreatments: string[];
  preventiveMeasures: string[];
}
```

**Required** per [schema_app.sql](file:///c:/projects/plant_disease_detection/ml/db/schema_app.sql#L25-L34):
```sql
CREATE TABLE diagnoses (
  id            TEXT PRIMARY KEY,
  image_id      TEXT NOT NULL REFERENCES images(id),
  class_label   TEXT NOT NULL,      -- "aculus_olive", not "Olive Bud Mite"
  confidence    REAL NOT NULL,
  topk_json     TEXT,               -- full top-5 JSON
  model_version TEXT NOT NULL,
  latency_ms    INTEGER,
  created_at    INTEGER NOT NULL
);
```

**Key differences**:
- The database uses `class_label` (e.g. `aculus_olive`), not `diseaseName` — the human-readable name comes from `knowledge.db → diseases.name_en/name_fr`
- `symptoms`, `recommendedTreatments`, `preventiveMeasures` are NOT stored in `app.db` — they come from `disease_docs.content_md` in `knowledge.db`
- The database tracks `topk_json` (top-5 predictions), `model_version`, and `latency_ms` — the frontend type has none of these

### 5. 🟡 Mock Disease List Doesn't Match Vision Model Classes

**Current mock diseases** in [mockData.ts](file:///c:/projects/plant_disease_detection/app/src/utils/mockData.ts):
- Olive Peacock Spot (`Spilocaea oleagina`)
- Olive Knot Disease (`Pseudomonas savastanoi`)
- Verticillium Wilt (`Verticillium dahliae`)
- Olive Anthracnose (`Colletotrichum gloeosporioides`)
- Leaf Chlorosis/Mineral Deficiency
- Healthy Olive Foliage

**Actual model classes** from [labels.json](file:///c:/projects/plant_disease_detection/models/vision/labels.json): `["aculus_olive", "olivepeacockspot"]` — only 2 classes.

The mock data has 6 diseases that don't match the real model. This is fine for the UI prototype but must be reconciled when wiring real inference.

### 6. 🟡 Node Version Warning

The colleague's project uses **Expo SDK 57** with **React Native 0.86.3**, which requires `node ^20.19.4 || ^22.13.0 || >=25.0.0`. Your system runs **Node v23.11.0**, which is NOT in those ranges. `npm install` succeeded with warnings but this could cause subtle issues.

**Fix**: Update [.nvmrc](file:///c:/projects/plant_disease_detection/.nvmrc) to `22` instead of `20`, and run `nvm install 22 && nvm use 22`.

---

## What's Good and Can Stay As-Is

These UI components are solid and align with the project goals:

| Component | Notes |
|---|---|
| **Splash screen** (`index.tsx`) | Animated olive leaf badge, auto-navigates to home |
| **Home dashboard** (`home.tsx`) | Camera/gallery capture, recent scans, orchard stats |
| **History** (`history.tsx`) | Filter by status, pull-to-refresh, delete with confirmation |
| **History detail** (`history-detail.tsx`) | Full diagnosis view, edit notes, delete |
| **Scanner animation** (`scanner.tsx`) | Laser scan line effect — keep as loading UX during real inference |
| **Account** (`account.tsx`) | Profile, settings links, app diagnostics |
| **LeafImage** component | Handles bundled samples, `file://`, `http://` URIs gracefully |
| **Image persistence** (`historyStorage.ts`) | Copies photos to persistent document directory |
| **Design system** (`theme.ts`) | Agricultural olive palette, consistent tokens |

---

## Recommended Action Plan (Priority Order)

| # | Task | Effort | Who |
|---|---|---|---|
| 1 | Install `onnxruntime-react-native` and wire real ONNX vision inference in `scanner.tsx` | Medium | Vision person |
| 2 | Install `expo-sqlite`, create DB service layer, migrate from AsyncStorage to SQLite | Medium | App shell person |
| 3 | Install `llama.rn`, create `chat.tsx` screen with `react-native-gifted-chat` | Large | LLM person |
| 4 | Load `knowledge.db` from bundled assets, implement disease card lookup by `class_label` | Medium | LLM person |
| 5 | Implement embedding + dot-product retrieval for Tier 2 RAG | Medium | RAG person |
| 6 | Reconcile `ScanResult` type with `app.db` schema (add `class_label`, `topk_json`, `model_version`, `latency_ms`) | Small | Anyone |
| 7 | Remove mock data once real inference + knowledge.db are wired | Small | Anyone |
