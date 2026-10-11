# Frontend & AI Tier 1 Integration Plan: Olive Care

**Scope**: Mobile frontend integration connecting real **ONNX vision classification**, **SQLite databases (`knowledge.db` + `app.db`)**, and **on-device SLM (`llama.rn`)** for Tier 1 grounded chat, bundled for Android rapid development.

---

## 1. Executive Summary & Flow Redesign

### Current vs. New Architecture Flow

```
[Current Mock Flow]
Home Dashboard ---> Take Photo / Pick Image ---> Scanner Animation (Mock 2.4s) ---> Static Diagnosis Details Screen
                                                                                              (Mock Disease)

[New Grounded AI Flow]
                  ┌─────────────────────────────────────────────────────────┐
                  │ Option A: Direct Chat (New!)                             │
                  │ "Ask Olive AI" Button (No photo required)               │
                  └─────────────────────────┬───────────────────────────────┘
                                            │
Home Dashboard                              ▼
      │                     ┌───────────────────────────────────────────────┐
      │                     │ Chat Session (General Agronomy Mode)          │
      │                     │ - app.db session created (disease_id: null)   │
      │                     │ - llama.rn answers general olive care Qs      │
      │                     └───────────────────────────────────────────────┘
      │
      ▼
Take / Select Photo
      │
      ▼
Scanner Screen (Real Vision Pipeline < 1 sec)
      │  1. Preprocess leaf image (224x224 RGB, ImageNet normalized)
      │  2. Run MobileNetV4 ONNX model via onnxruntime-react-native
      │  3. Map output index to class_label ('aculus_olive' | 'olivepeacockspot')
      │  4. Persist to app.db (sessions, images, diagnoses)
      │  5. Retrieve disease document from knowledge.db (Tier 1 context)
      │
      ▼
Auto-redirect to Chat Screen (Tier 1 Diagnostic Mode)
      │
      ├─── Sticky Top Header: Diagnosis Summary Badge (Leaf photo, Confidence, Disease Name)
      ├─── Assistant Auto-Greeting: Generated summary from disease document
      ├─── Quick Suggestion Chips: Populated from knowledge.db (suggested_questions)
      └─── Interactive Chat: llama.rn answers farmer's questions grounded strictly in disease doc
```

---

## 2. Key Architectural Decisions & Recommendations

### A. Model Bundling Strategy (APK vs. On-Device Storage)

> [!IMPORTANT]
> **APK Size vs. Build Times Warning:**
> - Android APKs have strict packaging constraints. A typical 3B or 4B GGUF model is **2.2 GB to 2.8 GB**. Bundling a file this size inside `assets/` will cause Gradle packaging to run out of memory (OOM) and make every test build take 15–25 minutes.
> - **Recommendation for Fast Local Dev**:
>   - **Vision**: Bundle `mobilenetv4_conv_small_fp32.onnx` + `.onnx.data` directly in assets (~10.2 MB total — negligible impact).
>   - **Knowledge Base**: Bundle `ml/build/knowledge.db` directly in assets (~94 KB — negligible impact).
>   - **SLM for APK Bundling**: Bundle an ultralight quantized SLM such as **`Qwen2.5-0.5B-Instruct-Q4_K_M.gguf`** (~390 MB) or **`SmolLM2-360M-Instruct-Q4_K_M.gguf`** (~230 MB). This allows one-click APK installation on the emulator without download overhead.
>   - *Production path*: Keep the option to download higher-capacity 3B/4B models (`Qwen2.5-3B` or `Gemma-3-4B`) via background download to `FileSystem.documentDirectory`.

---

### B. Database Migration: `AsyncStorage` ➔ `expo-sqlite`

We will implement two distinct database clients under `src/services/db/`:

```
src/services/db/
├── knowledgeDb.ts   # Read-only queries to knowledge.db (bundled asset)
├── appDb.ts         # Read-write queries to app.db (user history & chat)
└── dbInit.ts        # Startup initialization & asset copying
```

#### 1. `knowledge.db` (Read-Only Bundled Asset)
- Bundled in `assets/db/knowledge.db` (copied from `ml/build/knowledge.db`).
- On app launch, `dbInit.ts` checks if `FileSystem.documentDirectory + 'SQLite/knowledge.db'` exists. If not, copies it using `expo-file-system`.
- **Query functions**:
  - `getDiseaseByLabel(classLabel: string)`: returns `id`, `name_en`, `name_fr`.
  - `getDiseaseDoc(diseaseId: string)`: returns `content_md`.
  - `getSuggestedQuestions(diseaseId: string)`: returns array of question strings for UI chips.

#### 2. `app.db` (Read-Write User Store)
- Created on device via `SQLite.openDatabaseSync('app.db')`.
- Initialized with `schema_app.sql` schema:
  - `sessions`: id, title, created_at, updated_at
  - `images`: id, session_id, rel_path, width, height, created_at
  - `diagnoses`: id, image_id, class_label, confidence, topk_json, model_version, latency_ms, created_at
  - `messages`: id, session_id, role, content, tier, latency_ms, created_at
  - `settings`: key, value
- Replaces legacy `src/utils/historyStorage.ts`:
  - `history.tsx` queries: `SELECT * FROM sessions JOIN images JOIN diagnoses ORDER BY created_at DESC`.

---

### C. Vision Model Inference Pipeline (`src/services/vision/`)

The vision model uses MobileNetV4 Small (`mobilenetv4_conv_small_fp32.onnx` + `.onnx.data`):
1. **Asset preparation**: Metro requires both `.onnx` and `.onnx.data` files side-by-side in `assets/models/vision/`.
2. **Preprocessing**:
   - Resizes input image to `224 × 224`.
   - Extracts RGB byte values into a flat `Float32Array` of shape `[1, 3, 224, 224]`.
   - Applies standard ImageNet normalization:
     $$\text{norm}_c = \frac{x_c / 255.0 - \text{mean}_c}{\text{std}_c}$$
     where $\text{mean} = [0.485, 0.456, 0.406]$ and $\text{std} = [0.229, 0.224, 0.225]$.
3. **Inference**:
   - Runs `ort.InferenceSession.create(modelPath)`.
   - Applies Softmax across logits to compute probabilities.
   - Outputs top class: `aculus_olive` (Olive bud mite) or `olivepeacockspot` (Peacock spot).

---

### D. On-Device SLM & Tier 1 Prompting (`src/services/llm/`)

When a diagnosis is made:
1. `disease_docs.content_md` is fetched from `knowledge.db`.
2. `llama.rn` context is initialized with the GGUF model.
3. System prompt strictly constrains answers to the provided medical/agronomic sheet:

```text
<|im_start|>system
You are Olive Care AI, a specialist agronomist assisting an olive farmer.
The following verified diagnosis document was detected from their leaf scan:

### DIAGNOSIS DOCUMENT
{disease_docs.content_md}

CRITICAL RULES:
1. Answer the farmer's questions using ONLY the facts provided in the document above.
2. If the document does not contain the answer, say honestly: "I don't have verified data on that in the olive health guide. Please consult your local agricultural extension service."
3. Keep instructions concise, practical, and farmer-friendly.
<|im_end|>
```

4. For **Direct Chat** (no photo):
   - System prompt sets general olive assistant role without disease constraint.

---

## 3. Screen Modifications Breakdown

### 1. `home.tsx` (Home Dashboard)
- **Add**: "Ask Olive AI" card next to / beneath the photo capture options.
- **Action**: Generates a new session in `app.db` with `title: "Agronomy Consultation"`, navigates directly to `chat.tsx?sessionId=...`.

### 2. `scanner.tsx` (Scan Transition Screen)
- Replaces the 2.4s mock timer with:
  - Real ONNX inference execution (~100–300ms on device).
  - Writing session, image record, and diagnosis to `app.db`.
  - Fetching disease card from `knowledge.db`.
  - Seamless navigation to `/chat?sessionId=...&diseaseId=...&isNewScan=1`.

### 3. `chat.tsx` (New Chat Screen)
- Implemented with clean chat UI (`react-native-gifted-chat` or native high-performance components).
- **Features**:
  - Top card: Diagnosis summary (leaf preview thumbnail, disease name, confidence badge).
  - Tappable suggestion question chips from `knowledge.db`.
  - Streaming text generation from `llama.rn`.
  - Message history persistence in `app.db` (`messages` table).

### 4. `history.tsx` & `history-detail.tsx`
- Replace `AsyncStorage.getItem('@olive_care_history')` with direct `app.db` SQL query.
- Tapping any previous scan in history navigates directly into its chat session!

---

## 4. Chronological Implementation Phases

| Phase | Milestone | Key Deliverables | Dependencies |
|:---:|---|---|---|
| **Phase 1** | **Database & Asset Setup** | • Copy `knowledge.db` & schema into app assets<br>• Implement `dbInit.ts`, `knowledgeDb.ts`, `appDb.ts`<br>• Validate SQLite queries on emulator | `expo-sqlite` |
| **Phase 2** | **Vision ONNX Inference** | • Bundle MobileNetV4 ONNX files in `assets/models/`<br>• Implement `preprocessor.ts` & `visionClassifier.ts`<br>• Test on sample leaf images | `onnxruntime-react-native` |
| **Phase 3** | **Navigation & Scanner Refactor** | • Update `home.tsx` with direct chat button<br>• Refactor `scanner.tsx` to run ONNX model & save to `app.db`<br>• Redirect to `chat.tsx` | Phase 1 & 2 |
| **Phase 4** | **SLM Runtime (`llama.rn`)** | • Place lightweight GGUF model in app storage<br>• Build `llamaService.ts` with streaming support<br>• Implement Tier 1 prompt injection | `llama.rn` |
| **Phase 5** | **Chat UI & History Migration** | • Build `src/app/chat.tsx` with suggestion chips<br>• Migrate `history.tsx` to query `app.db`<br>• Verify end-to-end workflow on emulator | Phase 3 & 4 |

---

## 5. Next Steps & Confirmation

Before writing code:
1. Confirm choice of GGUF model for bundling (recommended: **Qwen2.5-0.5B-Instruct-Q4_K_M** ~390MB for local emulator testing).
2. Confirm if you want to proceed with **Phase 1 (Database & Asset Setup)**.
