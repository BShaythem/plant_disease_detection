"""
Build knowledge.db from human-authored content under knowledge/.

Usage:
    python scripts/build_knowledge_db.py

Reads:
    knowledge/plants.yaml
    knowledge/diseases/*.md      (frontmatter + tier-1 disease document)
    knowledge/corpus/**/*.md     (frontmatter + tier-2 RAG source documents)

Writes:
    ml/build/knowledge.db  (atomically — built to a temp file, renamed on success)

Fails loudly (non-zero exit) on:
    - a class_label with no matching row expected in the ONNX model's labels
      (set VISION_LABELS_PATH below once you have that file)
    - any embedding dim mismatch
    - any duplicate class_label / disease_id collision
"""

import sqlite3
import sys
import uuid
import json
import shutil
import argparse
from pathlib import Path
from datetime import datetime, timezone

import yaml
import frontmatter
import numpy as np
from sentence_transformers import SentenceTransformer

# ---------------------------------------------------------------------------
# Config — adjust these three paths/values for your environment
# ---------------------------------------------------------------------------

REPO_ROOT = Path(__file__).resolve().parents[2]
KNOWLEDGE_DIR = REPO_ROOT / "knowledge"
SCHEMA_PATH = REPO_ROOT / "ml" / "db" / "schema_knowledge.sql"
OUTPUT_PATH = REPO_ROOT / "ml" / "build" / "knowledge.db"

# Set this once you export your MobileNetV4 output labels to a JSON list,
# e.g. ["olive_peacock_spot", "olive_healthy", ...]. Leave as None to skip
# the cross-check (not recommended once the vision model is finalized).
VISION_LABELS_PATH = REPO_ROOT / "models" / "vision" / "labels.json"

# Must match whatever embedding model/runtime the app actually uses on-device.
# sentence-transformers here is for offline corpus building convenience;
# if you end up using llama.rn's embedding mode on-device instead, re-embed
# with the same GGUF via llama-cpp-python (or llama.cpp's CLI) so vectors
# from both sides are comparable. See the note at the bottom of this file.
EMBEDDING_MODEL_NAME = "intfloat/multilingual-e5-small"
CHUNK_WORDS = 300
CHUNK_OVERLAP_WORDS = 50


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_id() -> str:
    return str(uuid.uuid4())


# ---------------------------------------------------------------------------
# Loading content
# ---------------------------------------------------------------------------

def load_plants(conn: sqlite3.Connection) -> dict[str, str]:
    """Returns {plant_key_in_yaml: plant_id (== same key, kept 1:1 for simplicity)}."""
    plants_file = KNOWLEDGE_DIR / "plants.yaml"
    plants = yaml.safe_load(plants_file.read_text(encoding="utf-8"))

    id_map = {}
    for p in plants:
        conn.execute(
            "INSERT INTO plants (id, name_fr, name_ar, name_en, species) VALUES (?, ?, ?, ?, ?)",
            (p["id"], p.get("name_fr"), p.get("name_ar"), p.get("name_en"), p.get("species")),
        )
        id_map[p["id"]] = p["id"]
    print(f"  plants: {len(id_map)}")
    return id_map


def load_diseases(conn: sqlite3.Connection, plant_ids: dict[str, str]) -> tuple[dict[str, str], dict[str, str | None]]:
    """Returns ({class_label: disease_id}, {disease_id: plant_id})."""
    disease_files = sorted((KNOWLEDGE_DIR / "diseases_cards").glob("*.md"))
    class_label_to_id: dict[str, str] = {}
    disease_id_to_plant: dict[str, str | None] = {}

    for f in disease_files:
        post = frontmatter.load(f)
        fm = post.metadata
        class_label = fm["class_label"]

        if class_label in class_label_to_id:
            sys.exit(f"ERROR: duplicate class_label '{class_label}' in {f}")

        plant_key = fm.get("plant")
        if plant_key and plant_key not in plant_ids:
            sys.exit(f"ERROR: {f} references unknown plant '{plant_key}' — add it to plants.yaml")

        disease_id = new_id()
        class_label_to_id[class_label] = disease_id
        disease_id_to_plant[disease_id] = plant_key

        conn.execute(
            """INSERT INTO diseases
               (id, class_label, plant_id, name_fr, name_ar, name_en, scientific_name)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (
                disease_id, class_label, plant_key,
                fm["name_fr"], fm.get("name_ar"), fm.get("name_en"),
                fm.get("scientific_name"),
            ),
        )

        conn.execute(
            "INSERT INTO disease_docs (disease_id, lang, content_md, updated_at) VALUES (?, ?, ?, ?)",
            (disease_id, fm.get("lang", "fr"), post.content.strip(), now_iso()),
        )

        for i, q in enumerate(fm.get("suggested_questions", [])):
            conn.execute(
                """INSERT INTO suggested_questions
                   (id, disease_id, lang, question_text, sort_order) VALUES (?, ?, ?, ?, ?)""",
                (new_id(), disease_id, fm.get("lang", "fr"), q, i),
            )

    print(f"  diseases: {len(class_label_to_id)}")
    return class_label_to_id, disease_id_to_plant


def chunk_text(text: str, size: int, overlap: int) -> list[str]:
    words = text.split()
    if not words:
        return []
    chunks, start = [], 0
    while start < len(words):
        end = min(start + size, len(words))
        chunks.append(" ".join(words[start:end]))
        if end == len(words):
            break
        start = end - overlap
    return chunks

def load_corpus(
    conn: sqlite3.Connection,
    plant_ids: dict[str, str],
    class_label_to_id: dict[str, str],
    disease_id_to_plant: dict[str, str | None],
) -> list[tuple[str, str]]:
    """
    Loads:
      knowledge/corpus/diseases/<class_label>/*.md  -> chunks scoped to that disease
      knowledge/corpus/plants/<plant_id>/*.md       -> general chunks scoped to that plant only
    Returns [(chunk_id, chunk_text), ...] for the embedding step.
    """
    to_embed: list[tuple[str, str]] = []
    doc_count = chunk_count = 0

    def ingest(md_file: Path, disease_id: str | None, plant_id: str | None) -> None:
        nonlocal doc_count, chunk_count
        post = frontmatter.load(md_file)
        fm = post.metadata
        lang = fm.get("lang")
        if not lang:
            sys.exit(f"ERROR: {md_file} is missing required frontmatter field 'lang'")

        doc_id = new_id()
        conn.execute(
            "INSERT INTO documents (id, title, source, lang, license, plant_id) VALUES (?, ?, ?, ?, ?, ?)",
            (doc_id, fm.get("title", md_file.stem), fm.get("source"), lang, fm.get("license"), plant_id),
        )
        doc_count += 1

        for ord_, chunk in enumerate(chunk_text(post.content, CHUNK_WORDS, CHUNK_OVERLAP_WORDS)):
            chunk_id = new_id()
            conn.execute(
                """INSERT INTO chunks
                   (id, document_id, disease_id, plant_id, lang, ord, text)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (chunk_id, doc_id, disease_id, plant_id, lang, ord_, chunk),
            )
            to_embed.append((chunk_id, chunk))
            chunk_count += 1

    # corpus/diseases/<class_label>/*.md
    for disease_dir in sorted((KNOWLEDGE_DIR / "corpus" / "diseases").iterdir()):
        if not disease_dir.is_dir():
            continue
        class_label = disease_dir.name
        disease_id = class_label_to_id.get(class_label)
        if disease_id is None:
            sys.exit(f"ERROR: corpus/diseases/{class_label}/ has no matching disease card")
        plant_id = disease_id_to_plant.get(disease_id)
        for md_file in sorted(disease_dir.glob("*.md")):
            ingest(md_file, disease_id=disease_id, plant_id=plant_id)

    # corpus/plants/<plant_id>/*.md
    for plant_dir in sorted((KNOWLEDGE_DIR / "corpus" / "plants").iterdir()):
        if not plant_dir.is_dir():
            continue
        plant_id = plant_dir.name
        if plant_id not in plant_ids:
            sys.exit(f"ERROR: corpus/plants/{plant_id}/ has no matching entry in plants.yaml")
        for md_file in sorted(plant_dir.glob("*.md")):
            ingest(md_file, disease_id=None, plant_id=plant_id)

    print(f"  documents: {doc_count}, chunks: {chunk_count}")
    return to_embed


# ---------------------------------------------------------------------------
# Embedding
# ---------------------------------------------------------------------------

def embed_and_store(conn: sqlite3.Connection, to_embed: list[tuple[str, str]]) -> int:
    if not to_embed:
        print("  no chunks to embed")
        return 0

    print(f"  loading embedding model: {EMBEDDING_MODEL_NAME}")
    model = SentenceTransformer(EMBEDDING_MODEL_NAME)

    ids = [c[0] for c in to_embed]
    texts = [c[1] for c in to_embed]
    vectors = model.encode(texts, batch_size=32, show_progress_bar=True, convert_to_numpy=True)

    dim = vectors.shape[1]
    # Normalize at build time so on-device similarity is a plain dot product.
    norms = np.linalg.norm(vectors, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    vectors = (vectors / norms).astype(np.float32)

    conn.executemany(
        "INSERT INTO embeddings (chunk_id, vector) VALUES (?, ?)",
        [(cid, vec.tobytes()) for cid, vec in zip(ids, vectors)],
    )
    print(f"  embedded: {len(ids)} chunks, dim={dim}")
    return dim


# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------

def validate_against_vision_labels(class_label_to_id: dict[str, str]) -> None:
    if VISION_LABELS_PATH is None:
        print("  (skipped: VISION_LABELS_PATH not set)")
        return

    model_labels = set(json.loads(Path(VISION_LABELS_PATH).read_text(encoding="utf-8")))
    db_labels = set(class_label_to_id.keys())

    missing_in_db = model_labels - db_labels
    missing_in_model = db_labels - model_labels

    if missing_in_db:
        sys.exit(f"ERROR: vision model has labels with no disease card: {sorted(missing_in_db)}")
    if missing_in_model:
        sys.exit(f"ERROR: disease cards exist for labels not in the vision model: {sorted(missing_in_model)}")

    print(f"  OK: {len(model_labels)} labels match exactly")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", type=Path, default=OUTPUT_PATH)
    args = parser.parse_args()

    tmp_path = args.out.with_suffix(".tmp.db")
    args.out.parent.mkdir(parents=True, exist_ok=True)
    tmp_path.unlink(missing_ok=True)

    conn = sqlite3.connect(tmp_path)
    conn.execute("PRAGMA foreign_keys = ON")

    try:
        print("Applying schema...")
        conn.executescript(SCHEMA_PATH.read_text(encoding="utf-8"))

        print("Loading plants...")
        plant_ids = load_plants(conn)

        print("Loading diseases + tier-1 docs...")
        class_label_to_id, disease_id_to_plant = load_diseases(conn, plant_ids)

        print("Validating against vision model labels...")
        validate_against_vision_labels(class_label_to_id)

        print("Loading tier-2 corpus...")
        to_embed = load_corpus(conn, plant_ids, class_label_to_id, disease_id_to_plant)

        print("Embedding chunks...")
        dim = embed_and_store(conn, to_embed)

        print("Writing meta...")
        conn.executemany(
            "INSERT INTO meta (key, value) VALUES (?, ?)",
            [
                ("schema_version", "1"),
                ("embedding_model", EMBEDDING_MODEL_NAME),
                ("embedding_dim", str(dim)),
                ("built_at", now_iso()),
            ],
        )

        conn.commit()
        conn.execute("PRAGMA integrity_check")
        conn.close()

    except Exception:
        conn.close()
        tmp_path.unlink(missing_ok=True)
        raise

    shutil.move(str(tmp_path), str(args.out))
    print(f"\nBuilt {args.out} ({args.out.stat().st_size / 1024:.1f} KB)")


if __name__ == "__main__":
    main()