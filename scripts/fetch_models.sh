#!/usr/bin/env bash
set -euo pipefail

# fetch_models.sh — downloads model weights into models/ (gitignored).
# Model weights are never committed to git — see .gitignore.

MODELS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/models"

echo "== Vision model =="
VISION_DIR="$MODELS_DIR/vision"
mkdir -p "$VISION_DIR"

VISION_REPO="haythembs/plant_disease_detection_vison_models"
VISION_FILES=(
  "mobilenetv4_conv_small_fp32.onnx"
  "mobilenetv4_conv_small_fp32.onnx.data"
)

for f in "${VISION_FILES[@]}"; do
  if [ -f "$VISION_DIR/$f" ]; then
    echo "  already present: $f"
    continue
  fi
  echo "  downloading: $f"
  curl -L -o "$VISION_DIR/$f" \
    "https://huggingface.co/${VISION_REPO}/resolve/main/${f}"
done
echo "Vision model files are in $VISION_DIR"
echo

echo "== LLM model =="
echo "No SLM has been selected yet (benchmark in progress — see docs/SETUP_AI.md)."
echo "Download benchmark candidates manually for now, e.g.:"
echo
echo "  huggingface-cli download bartowski/Qwen3-4B-Instruct-GGUF \\"
echo "    --include '*Q4_K_M*' --local-dir models/llm/qwen3-4b"
echo
echo "  huggingface-cli download bartowski/gemma-3-4b-it-GGUF \\"
echo "    --include '*Q4_K_M*' --local-dir models/llm/gemma3-4b"
echo
echo "Once a model is chosen: set LLM_MODEL_PATH in .env, then add its"
echo "download command to this script, same pattern as the vision model above."
echo

echo "== Embedding model =="
echo "Not finalized yet — depends on the llama.rn-vs-ONNX smoke test."
echo "See docs/SETUP_AI.md, section 'Embeddings', before fetching one."