// src/services/db/dbInit.ts
import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';
import { Platform } from 'react-native';

let knowledgeDatabase: SQLite.SQLiteDatabase | null = null;
let appDatabase: SQLite.SQLiteDatabase | null = null;
let isInitialized = false;

const APP_DB_SCHEMA = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version    INTEGER PRIMARY KEY,
  applied_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id         TEXT PRIMARY KEY,
  title      TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS images (
  id          TEXT PRIMARY KEY,
  session_id  TEXT REFERENCES sessions(id) ON DELETE CASCADE,
  rel_path    TEXT NOT NULL,
  width       INTEGER,
  height      INTEGER,
  created_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_images_session ON images(session_id);

CREATE TABLE IF NOT EXISTS diagnoses (
  id            TEXT PRIMARY KEY,
  image_id      TEXT NOT NULL REFERENCES images(id) ON DELETE CASCADE,
  class_label   TEXT NOT NULL,
  confidence    REAL NOT NULL,
  topk_json     TEXT,
  model_version TEXT NOT NULL,
  latency_ms    INTEGER,
  created_at    INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_diagnoses_image ON diagnoses(image_id);

CREATE TABLE IF NOT EXISTS messages (
  id          TEXT PRIMARY KEY,
  session_id  TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  role        TEXT NOT NULL,
  content     TEXT NOT NULL,
  tier        INTEGER,
  image_id    TEXT REFERENCES images(id),
  model_id    TEXT,
  latency_ms  INTEGER,
  created_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id, created_at);

CREATE TABLE IF NOT EXISTS message_sources (
  message_id TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  chunk_id   TEXT NOT NULL,
  score      REAL NOT NULL,
  PRIMARY KEY (message_id, chunk_id)
);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;

/**
 * Ensures knowledge.db asset is copied into the local SQLite directory.
 */
async function setupKnowledgeDatabaseFile(): Promise<void> {
  if (Platform.OS === 'web') return;

  const docDir = FileSystem.documentDirectory;
  if (!docDir) throw new Error('FileSystem documentDirectory is null');

  const sqliteDir = `${docDir}SQLite`;
  const dbFile = `${sqliteDir}/knowledge.db`;

  const dirInfo = await FileSystem.getInfoAsync(sqliteDir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(sqliteDir, { intermediates: true });
  }

  // Always check or copy the bundled asset
  const fileInfo = await FileSystem.getInfoAsync(dbFile);
  if (!fileInfo.exists) {
    console.log('[DB] Copying bundled knowledge.db asset to device storage...');
    const asset = Asset.fromModule(require('../../../assets/db/knowledge.db'));
    await asset.downloadAsync();

    const sourceUri = asset.localUri || asset.uri;
    if (!sourceUri) {
      throw new Error('[DB] Could not resolve localUri for knowledge.db asset');
    }

    await FileSystem.copyAsync({
      from: sourceUri,
      to: dbFile,
    });
    console.log('[DB] knowledge.db copied successfully');
  }
}

/**
 * Initializes both knowledge.db (read-only) and app.db (read-write).
 * Idempotent: can be called multiple times safely.
 */
export async function initDatabases(): Promise<{
  knowledgeDb: SQLite.SQLiteDatabase;
  appDb: SQLite.SQLiteDatabase;
}> {
  if (isInitialized && knowledgeDatabase && appDatabase) {
    return { knowledgeDb: knowledgeDatabase, appDb: appDatabase };
  }

  try {
    // 1. Copy bundled knowledge.db if needed
    await setupKnowledgeDatabaseFile();

    // 2. Open knowledge.db
    knowledgeDatabase = SQLite.openDatabaseSync('knowledge.db');

    // 3. Open app.db and initialize schema
    appDatabase = SQLite.openDatabaseSync('app.db');
    await appDatabase.execAsync(APP_DB_SCHEMA);

    isInitialized = true;
    console.log('[DB] Databases initialized successfully');

    return { knowledgeDb: knowledgeDatabase, appDb: appDatabase };
  } catch (error) {
    console.error('[DB] Failed to initialize databases:', error);
    throw error;
  }
}

export function getKnowledgeDb(): SQLite.SQLiteDatabase {
  if (!knowledgeDatabase) {
    throw new Error('knowledge.db not initialized. Call initDatabases() first.');
  }
  return knowledgeDatabase;
}

export function getAppDb(): SQLite.SQLiteDatabase {
  if (!appDatabase) {
    throw new Error('app.db not initialized. Call initDatabases() first.');
  }
  return appDatabase;
}
