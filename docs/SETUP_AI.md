# Setup AI — fetching and testing models

This covers only the models (vision, LLM, embeddings) — see the main
`README.md` for the rest of the environment.

## Why this is a separate file

The SLM and embedding model choices aren't finalized yet (benchmarking
in progress, week 1) — this document will change several times this
week. Keeping it separate from the README avoids polluting the general
docs with things that are still moving.

## 1. Models needed

| Model | Role | Format | Status |
|---|---|---|---|
| MobileNetV4-conv-small | Vision classification | ONNX (`.onnx` + `.onnx_data`) | ✅ Available |
| SLM (TBD) | Text generation | Quantized GGUF | 🔄 Benchmarking |
| Embedding model (TBD) | RAG search | GGUF (via llama.rn) or ONNX (fallback) | 🔄 Testing |

All go under `models/` (gitignored — see root `.gitignore`). Never
commit these files.

## 2. Fetching the models

```bash
bash scripts/fetch_models.sh
```

### Vision
Already hosted at
[`haythembs/plant_disease_detection_vison_models`](https://huggingface.co/haythembs/plant_disease_detection_vison_models)
on Hugging Face. The script pulls exactly the two files needed:
`mobilenetv4_conv_small_fp32.onnx` and
`mobilenetv4_conv_small_fp32.onnx.data`.

**Important**: both files must stay side by side, in the same folder,
never renamed — the `.onnx` references the `.onnx_data` by filename.

### LLM candidates (for benchmarking)

Not finalized — pull a few candidates and compare on-device. Good
starting points, given the French/Arabic requirement:

```bash
huggingface-cli login   # paste the token from .env (HUGGINGFACE_TOKEN)

huggingface-cli download bartowski/Qwen3-4B-Instruct-GGUF \
  --include "*Q4_K_M*" --local-dir models/llm/qwen3-4b

huggingface-cli download bartowski/gemma-3-4b-it-GGUF \
  --include "*Q4_K_M*" --local-dir models/llm/gemma3-4b
```

Qwen3 has the strongest published multilingual coverage of the small
models and is the priority candidate to test first. Gemma 3 is a solid
second. Include a smaller/faster model (e.g. Qwen3 1.7B) as a
latency baseline even if its French/Arabic quality turns out weaker.

### Embedding model

Not finalized — see Test 3 below before fetching one.

## 3. Day-0 smoke tests — before writing a single screen

Don't start building screens until all four pass. Each isolates a
different technical risk.

### Test 1 — Vision (ONNX)
Load the model, run it on one bundled test image, log the top-1 label
and inference time.
Confirms: `onnxruntime-react-native` and the external `.onnx_data` file
both load correctly on-device.

⚠️ Before this test, confirm the exact preprocessing (image size,
normalization, RGB/BGR channel order) — see `docs/ARCHITECTURE.md`,
"Preprocessing parity" section. Wrong preprocessing doesn't crash the
model, it just returns wrong predictions.

### Test 2 — LLM (llama.rn)
Load a GGUF, generate 20 tokens, log tokens/second.
Confirms: the runtime works, and gives a baseline before comparing
candidates.

### Test 3 — Embeddings
Test whether `llama.rn` can run embedding mode with the chosen GGUF
(`--embedding`). If it works → one engine for both LLM and embeddings,
no JS tokenizer to manage. If not → fallback to ONNX + a JS tokenizer
(see `onnxruntime-extensions`).
**Do this test early** — it determines the rest of the RAG pipeline's
architecture.

### Test 4 — Databases
Open `app.db`, run the migration, insert a session + a message, read
it back. Copy `knowledge.db` from bundled assets to the document
directory on first launch, open it read-only.

## 4. Switching models during the benchmark

Change the paths in `.env` (`LLM_MODEL_PATH`, etc.) rather than
hardcoding a path in the app — lets you test multiple candidates
without recompiling.

## 5. Once the SLM and embedding model are chosen

1. Update `EMBEDDING_MODEL_NAME` in
   `ml/scripts/build_knowledge_db.py` to use **the same** model that's
   embedded in the app (llama.rn or ONNX — see Test 3). Corpus vectors
   and question vectors must come from the same model, or similarity
   scores are meaningless.
2. Rebuild `knowledge.db`:
```bash
   python ml/scripts/build_knowledge_db.py
```
3. Verify `meta.embedding_dim` in the database matches the actual
   dimension of the model embedded in the app — a mismatch here fails
   silently otherwise (see `docs/SCHEMA.md`).

## Known pitfalls (Android/iOS)

- **iOS**: add the increased-memory entitlement in `app.json`
  (`com.apple.developer.kernel.increased-memory-limit`) — otherwise a
  multi-GB GGUF crashes on load.
- **Metro**: `metro.config.js` must include `onnx`, `gguf`, `db` in
  `resolver.assetExts`, or these files silently aren't packaged into
  the build.
- **Expo Go does not work** — native modules required, always use a
  dev client (`expo run:android` / `run:ios`).