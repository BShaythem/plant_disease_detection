// src/services/db/appDb.ts
import { getAppDb } from './dbInit';
import {
  SessionRecord,
  ImageRecord,
  DiagnosisRecord,
  MessageRecord,
  ScanHistoryItem,
} from './types';

function generateUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// --- Sessions ---

export async function createSession(title?: string): Promise<SessionRecord> {
  const db = getAppDb();
  const now = Date.now();
  const session: SessionRecord = {
    id: generateUuid(),
    title: title || 'New Session',
    created_at: now,
    updated_at: now,
  };

  await db.runAsync(
    'INSERT INTO sessions (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)',
    [session.id, session.title, session.created_at, session.updated_at]
  );

  return session;
}

export async function getSession(id: string): Promise<SessionRecord | null> {
  const db = getAppDb();
  const row = await db.getFirstAsync<SessionRecord>('SELECT * FROM sessions WHERE id = ?', [id]);
  return row ?? null;
}

export async function updateSessionTitle(id: string, title: string): Promise<void> {
  const db = getAppDb();
  await db.runAsync('UPDATE sessions SET title = ?, updated_at = ? WHERE id = ?', [
    title,
    Date.now(),
    id,
  ]);
}

export async function deleteSession(id: string): Promise<void> {
  const db = getAppDb();
  // Cascading foreign keys will delete associated images, diagnoses, messages
  await db.runAsync('DELETE FROM sessions WHERE id = ?', [id]);
}

// --- Images ---

export async function saveImage(params: {
  sessionId: string;
  relPath: string;
  width?: number | null;
  height?: number | null;
}): Promise<ImageRecord> {
  const db = getAppDb();
  const now = Date.now();
  const image: ImageRecord = {
    id: generateUuid(),
    session_id: params.sessionId,
    rel_path: params.relPath,
    width: params.width ?? null,
    height: params.height ?? null,
    created_at: now,
  };

  await db.runAsync(
    'INSERT INTO images (id, session_id, rel_path, width, height, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [image.id, image.session_id, image.rel_path, image.width, image.height, image.created_at]
  );

  return image;
}

// --- Diagnoses ---

export async function saveDiagnosis(params: {
  imageId: string;
  classLabel: string;
  confidence: number;
  topkJson?: string | null;
  modelVersion: string;
  latencyMs?: number | null;
}): Promise<DiagnosisRecord> {
  const db = getAppDb();
  const now = Date.now();
  const diagnosis: DiagnosisRecord = {
    id: generateUuid(),
    image_id: params.imageId,
    class_label: params.classLabel,
    confidence: params.confidence,
    topk_json: params.topkJson ?? null,
    model_version: params.modelVersion,
    latency_ms: params.latencyMs ?? null,
    created_at: now,
  };

  await db.runAsync(
    `INSERT INTO diagnoses (id, image_id, class_label, confidence, topk_json, model_version, latency_ms, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      diagnosis.id,
      diagnosis.image_id,
      diagnosis.class_label,
      diagnosis.confidence,
      diagnosis.topk_json,
      diagnosis.model_version,
      diagnosis.latency_ms,
      diagnosis.created_at,
    ]
  );

  return diagnosis;
}

// --- Messages ---

export async function saveMessage(params: {
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tier?: number | null;
  imageId?: string | null;
  modelId?: string | null;
  latencyMs?: number | null;
}): Promise<MessageRecord> {
  const db = getAppDb();
  const now = Date.now();
  const message: MessageRecord = {
    id: generateUuid(),
    session_id: params.sessionId,
    role: params.role,
    content: params.content,
    tier: params.tier ?? null,
    image_id: params.imageId ?? null,
    model_id: params.modelId ?? null,
    latency_ms: params.latencyMs ?? null,
    created_at: now,
  };

  await db.runAsync(
    `INSERT INTO messages (id, session_id, role, content, tier, image_id, model_id, latency_ms, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      message.id,
      message.session_id,
      message.role,
      message.content,
      message.tier,
      message.image_id,
      message.model_id,
      message.latency_ms,
      message.created_at,
    ]
  );

  // Update session updated_at
  await db.runAsync('UPDATE sessions SET updated_at = ? WHERE id = ?', [now, message.session_id]);

  return message;
}

export async function getSessionMessages(sessionId: string): Promise<MessageRecord[]> {
  const db = getAppDb();
  return await db.getAllAsync<MessageRecord>(
    'SELECT * FROM messages WHERE session_id = ? ORDER BY created_at ASC',
    [sessionId]
  );
}

// --- History & Queries ---

export async function getRecentScans(limit = 50): Promise<ScanHistoryItem[]> {
  const db = getAppDb();
  const query = `
    SELECT 
      s.id AS sessionId,
      d.id AS diagnosisId,
      i.id AS imageId,
      i.rel_path AS imageUri,
      d.class_label AS classLabel,
      d.confidence AS confidence,
      d.created_at AS createdAt
    FROM diagnoses d
    JOIN images i ON d.image_id = i.id
    JOIN sessions s ON i.session_id = s.id
    ORDER BY d.created_at DESC
    LIMIT ?
  `;

  const rows = await db.getAllAsync<{
    sessionId: string;
    diagnosisId: string;
    imageId: string;
    imageUri: string;
    classLabel: string;
    confidence: number;
    createdAt: number;
  }>(query, [limit]);

  return rows.map((r) => {
    const isHealthy = r.classLabel.toLowerCase() === 'healthy';
    let humanName = r.classLabel;
    if (r.classLabel === 'aculus_olive') humanName = 'Olive bud mite';
    else if (r.classLabel === 'olivepeacockspot') humanName = 'Peacock spot';
    else if (isHealthy) humanName = 'Healthy Olive Foliage';

    return {
      sessionId: r.sessionId,
      diagnosisId: r.diagnosisId,
      imageId: r.imageId,
      imageUri: r.imageUri,
      classLabel: r.classLabel,
      diseaseName: humanName,
      confidence: r.confidence,
      createdAt: r.createdAt,
      status: isHealthy ? 'healthy' : 'infected',
    };
  });
}

// --- Settings ---

export async function getSetting(key: string): Promise<string | null> {
  const db = getAppDb();
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', [
    key,
  ]);
  return row ? row.value : null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = getAppDb();
  await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value]);
}
