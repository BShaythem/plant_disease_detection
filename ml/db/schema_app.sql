PRAGMA foreign_keys = ON;

CREATE TABLE schema_migrations (
  version    INTEGER PRIMARY KEY,
  applied_at INTEGER NOT NULL
);

CREATE TABLE sessions (
  id         TEXT PRIMARY KEY,
  title      TEXT,
  created_at INTEGER NOT NULL,   -- unix ms, UTC
  updated_at INTEGER NOT NULL
);

CREATE TABLE images (
  id          TEXT PRIMARY KEY,
  session_id  TEXT REFERENCES sessions(id) ON DELETE CASCADE,
  rel_path    TEXT NOT NULL,     -- RELATIVE path — see note below
  width       INTEGER,
  height      INTEGER,
  created_at  INTEGER NOT NULL
);
CREATE INDEX idx_images_session ON images(session_id);

CREATE TABLE diagnoses (
  id            TEXT PRIMARY KEY,
  image_id      TEXT NOT NULL REFERENCES images(id) ON DELETE CASCADE,
  class_label   TEXT NOT NULL,
  confidence    REAL NOT NULL,
  topk_json     TEXT,            -- full top-5 for debugging + UI
  model_version TEXT NOT NULL,
  latency_ms    INTEGER,
  created_at    INTEGER NOT NULL
);
CREATE INDEX idx_diagnoses_image ON diagnoses(image_id);

CREATE TABLE messages (
  id          TEXT PRIMARY KEY,
  session_id  TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  role        TEXT NOT NULL,     -- 'user' | 'assistant' | 'system'
  content     TEXT NOT NULL,
  tier        INTEGER,           -- 1 = card lookup, 2 = RAG, NULL = user msg
  image_id    TEXT REFERENCES images(id),
  model_id    TEXT,
  latency_ms  INTEGER,
  created_at  INTEGER NOT NULL
);
CREATE INDEX idx_messages_session ON messages(session_id, created_at);

-- RAG citations: which chunks grounded which answer
CREATE TABLE message_sources (
  message_id TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  chunk_id   TEXT NOT NULL,      -- references knowledge.db — no FK across files
  score      REAL NOT NULL,
  PRIMARY KEY (message_id, chunk_id)
);

CREATE TABLE settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);