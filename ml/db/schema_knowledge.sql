-- ml/db/schema_knowledge.sql
-- Read-only knowledge base, bundled with the app and rebuilt by ml/scripts/build_knowledge_db.py.
-- Never written to at runtime. See schema_app.sql for the separate read-write user-data database.

PRAGMA foreign_keys = ON;

-- Build metadata. The app reads this at startup to sanity-check compatibility
-- before trusting anything else in the file (embedding_dim especially — a mismatch
-- between this and the on-device embedding model produces meaningless similarity
-- scores with no error, so fail loudly instead).
CREATE TABLE meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
-- Rows written at build time:
--   schema_version      e.g. '1'
--   embedding_model      e.g. 'bge-small-en-v1.5' or the GGUF used for llama.rn embeddings
--   embedding_dim         e.g. '384'
--   vision_model_version  e.g. 'mobilenetv4_conv_small_v1'
--   built_at              ISO 8601 UTC timestamp

-- Crops supported by the app. Must be defined before diseases to satisfy foreign key ordering.
CREATE TABLE plants (
  id      TEXT PRIMARY KEY,
  name_fr TEXT NOT NULL,
  name_ar TEXT,
  name_en TEXT,
  species TEXT   -- e.g. 'Olea europaea'
);

-- One row per class the vision model can output. class_label MUST match the
-- ONNX model's output labels exactly — the build script should fail if any
-- label in the model has no matching row here, or vice versa.
CREATE TABLE diseases (
  id              TEXT PRIMARY KEY,          -- uuid
  class_label     TEXT NOT NULL UNIQUE,      -- exact string emitted by the vision model
  name_fr         TEXT NOT NULL,
  name_ar         TEXT,
  name_en         TEXT,
  scientific_name TEXT,
  plant_id        TEXT REFERENCES plants(id)
);

CREATE TABLE disease_docs (
  disease_id TEXT PRIMARY KEY REFERENCES diseases(id) ON DELETE CASCADE,
  lang       TEXT NOT NULL DEFAULT 'fr',
  content_md TEXT NOT NULL,   -- full markdown body: symptoms, cause, treatment, prevention...
  updated_at TEXT NOT NULL    -- ISO 8601, from build time — lets the app show "content as of..."
);

-- UI-only: labels for tappable suggested-question chips shown after a diagnosis.
-- No answer column — tapping a chip just runs its question_text through the
-- normal generation path (disease_docs context, same as free-typed text).
-- Purely cosmetic; carries no weight in how answers are generated.
CREATE TABLE suggested_questions (
  id            TEXT PRIMARY KEY,
  disease_id    TEXT NOT NULL REFERENCES diseases(id) ON DELETE CASCADE,
  lang          TEXT NOT NULL,
  question_text TEXT NOT NULL,
  sort_order    INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_suggested_questions_disease ON suggested_questions(disease_id, lang);

-- Tier 2: RAG corpus. Provenance for each source document.
CREATE TABLE documents (
  id       TEXT PRIMARY KEY,
  title    TEXT NOT NULL,
  source   TEXT,     -- e.g. filename, URL, or citation
  lang     TEXT NOT NULL,
  license  TEXT,
  plant_id TEXT REFERENCES plants(id)
);

-- Chunks of ~200-400 words, the retrievable unit for Tier 2.
-- disease_id is nullable: set it to scope a chunk to one disease (used to
-- filter retrieval when a diagnosis is known), leave it null for general
-- agronomy content (soil, climate, pruning) that's always searchable.
CREATE TABLE chunks (
  id          TEXT PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  disease_id  TEXT REFERENCES diseases(id),
  plant_id    TEXT REFERENCES plants(id),
  lang        TEXT NOT NULL,
  ord         INTEGER NOT NULL,   -- position within the source document
  text        TEXT NOT NULL
);
CREATE INDEX idx_chunks_disease ON chunks(disease_id, lang);
CREATE INDEX idx_chunks_document ON chunks(document_id);

-- One embedding vector per chunk. Kept separate from chunks (rather than a
-- column on it) because the two are read very differently at runtime: chunk
-- TEXT is read only for the few retrieved rows, while every VECTOR is read
-- once, in bulk, at app startup.
CREATE TABLE embeddings (
  chunk_id TEXT PRIMARY KEY REFERENCES chunks(id) ON DELETE CASCADE,
  vector   BLOB NOT NULL     -- float32 little-endian, L2-NORMALIZED at build time
                             -- so on-device similarity is a plain dot product
);