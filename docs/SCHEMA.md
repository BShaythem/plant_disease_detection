# Database schema

Two SQLite databases, kept deliberately separate. Neither one references
the other with a foreign key — SQLite can't enforce constraints across
files, and this boundary is intentional, not a limitation to work around.

| | `knowledge.db` | `app.db` |
|---|---|---|
| Written by | `ml/scripts/build_knowledge_db.py`, offline | The app, at runtime, on-device |
| Ships as | Bundled read-only asset | Created empty on first launch |
| Changed by | A new app release | Every user action |
| Schema source | `ml/db/schema_knowledge.sql` | `MIGRATIONS` array in the app |

---

## `knowledge.db`

### `meta`
Key/value build metadata: `schema_version`, `embedding_model`,
`embedding_dim`, `built_at`. The app checks `embedding_dim` against the
on-device embedding model at startup — a mismatch produces meaningless
similarity scores with no error otherwise, so this check exists to fail
loudly instead.

### `plants`
One row per crop the app supports (currently just olive). Exists so
that both diseases and general corpus content (e.g. seasonal
fertilizer advice) can be scoped to a plant independent of any disease.

### `diseases`
One row per class the vision model can output. `class_label` must
match the ONNX model's output labels exactly, character for character —
the build script hard-fails on any mismatch in either direction.
`plant_id` links each disease to its crop; nullable, to leave room for
a disease affecting multiple plants without a schema change later.

### `disease_docs`
One row per disease: the full written document (symptoms, cause,
treatment, prevention) as a single `content_md` field. This is Tier 1's
entire content model — not a table of pre-written Q&A pairs, because
matching free-typed questions against a fixed question set was found to
be unreliable. Instead the whole document is loaded into the SLM's
context whenever that disease is diagnosed, and the model answers
directly from it.

### `suggested_questions`
UI-only tappable chip labels per disease. No answer column — tapping a
chip runs its text through the same generation path as anything typed
by hand. This table has no influence on how answers are generated; it
only populates buttons.

### `documents`
Provenance for Tier 2 corpus sources: title, source, language, license,
and the `plant_id` it belongs to (nullable — see below).

### `chunks`
The corpus split into retrievable pieces (~200–400 words). Two
independent, nullable scope columns:

- `disease_id` — set for chunks specific to one disease (e.g. a
  treatment protocol), `NULL` for chunks that apply regardless of
  diagnosis.
- `plant_id` — set for chunks specific to one crop (e.g. "olive
  fertilizer in autumn"), independent of whether a disease is involved.

Both are applied as an `AND` filter at retrieval time:
```sql
WHERE (disease_id = :currentDisease OR disease_id IS NULL)
  AND (plant_id   = :currentPlant  OR plant_id  IS NULL)
```

### `embeddings`
One normalized float32 vector per chunk, stored as a `BLOB`. Kept in a
separate table from `chunks` (not a column on it) because the two are
read at different times: chunk `text` is read only for the handful of
retrieved rows, while every vector is read once, in bulk, at app
startup. Vectors are L2-normalized at build time so on-device
similarity search is a plain dot product rather than a cosine
computation.

---

## `app.db`

### `sessions`
One row per farmer conversation — in practice, one per photographed
plant. Populates the history screen; `updated_at` drives sort order.

### `images`
One row per photo. `rel_path` is a path **relative to the app's
document directory**, never absolute — the iOS sandbox path changes on
every app update, so an absolute path saved today is dead after the
next release. The image bytes live on the filesystem; only the pointer
and dimensions live in the database.

### `diagnoses`
Vision model output for an image: `class_label`, `confidence`, full
top-5 (`topk_json`), `model_version`, `latency_ms`. Deliberately
separate from `images` so re-running a newer model on an old photo adds
a row rather than overwriting history — useful for comparing model
versions during development.

### `messages`
The chat transcript. `role` is `user` / `assistant` / `system`. `tier`
records how an assistant message was produced — `1` for card-grounded,
`2` for RAG-augmented, `NULL` for user messages — which makes "how
often did Tier 2 fire" a single query rather than a guess.

### `message_sources`
Which corpus chunks (by `chunk_id`, scored) grounded a given message.
No foreign key to `chunks` — that table lives in the other file. This
is the citation trail: it powers a "sources" UI affordance and lets you
audit a bad answer after the fact.

### `settings`
App-level key/value settings.

### `schema_migrations`
Tracks which migrations have run. **Rule: never edit a migration once
it has run on any teammate's device — always append a new one.** This
is what keeps three people's local databases from diverging.

---

## Conventions used throughout

- **Primary keys are UUID text**, not autoincrementing integers — no
  collision risk if this ever needs to sync to a server.
- **Timestamps are integer Unix milliseconds, UTC** — sorts correctly,
  no timezone ambiguity.
- **`PRAGMA foreign_keys = ON`** must be set explicitly on every
  connection; SQLite defaults it off.