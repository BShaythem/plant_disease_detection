import json
from pathlib import Path

# Path to training run config
TRAIN_CFG = Path("../olive_leaf_disease_description/monia_models/mobilenetv4_conv_small/config.json")
OUT_PATH = Path("models/vision/labels.json")

if TRAIN_CFG.exists():
    cfg = json.loads(TRAIN_CFG.read_text())
    labels = cfg.get("class_names", [])
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(labels, indent=2))
    print(f"Generated {OUT_PATH} with {len(labels)} classes: {labels}")
