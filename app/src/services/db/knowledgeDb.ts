// src/services/db/knowledgeDb.ts
import { getKnowledgeDb } from './dbInit';
import { DiseaseRecord, DiseaseDocRecord, SuggestedQuestionRecord, KnowledgeMeta } from './types';

/**
 * Look up a disease by its exact vision model class label (e.g. 'aculus_olive', 'olivepeacockspot').
 */
export async function getDiseaseByLabel(classLabel: string): Promise<DiseaseRecord | null> {
  const db = getKnowledgeDb();
  const row = await db.getFirstAsync<DiseaseRecord>(
    'SELECT * FROM diseases WHERE class_label = ? LIMIT 1',
    [classLabel]
  );
  return row ?? null;
}

/**
 * Look up a disease by its UUID.
 */
export async function getDiseaseById(id: string): Promise<DiseaseRecord | null> {
  const db = getKnowledgeDb();
  const row = await db.getFirstAsync<DiseaseRecord>(
    'SELECT * FROM diseases WHERE id = ? LIMIT 1',
    [id]
  );
  return row ?? null;
}

/**
 * Retrieve all diseases supported in knowledge.db.
 */
export async function getAllDiseases(): Promise<DiseaseRecord[]> {
  const db = getKnowledgeDb();
  return await db.getAllAsync<DiseaseRecord>('SELECT * FROM diseases ORDER BY name_en ASC');
}

/**
 * Retrieve the full markdown disease document for Tier 1 context grounding.
 */
export async function getDiseaseDoc(
  diseaseId: string,
  preferredLang: 'fr' | 'ar' | 'en' = 'fr'
): Promise<DiseaseDocRecord | null> {
  const db = getKnowledgeDb();
  // Try preferred language first
  let row = await db.getFirstAsync<DiseaseDocRecord>(
    'SELECT * FROM disease_docs WHERE disease_id = ? AND lang = ? LIMIT 1',
    [diseaseId, preferredLang]
  );

  // Fallback to any available language if preferred is missing
  if (!row) {
    row = await db.getFirstAsync<DiseaseDocRecord>(
      'SELECT * FROM disease_docs WHERE disease_id = ? LIMIT 1',
      [diseaseId]
    );
  }

  return row ?? null;
}

/**
 * Retrieve suggested question chip labels for a diagnosed disease.
 */
export async function getSuggestedQuestions(
  diseaseId: string,
  preferredLang: 'fr' | 'ar' | 'en' = 'fr'
): Promise<SuggestedQuestionRecord[]> {
  const db = getKnowledgeDb();
  const rows = await db.getAllAsync<SuggestedQuestionRecord>(
    'SELECT * FROM suggested_questions WHERE disease_id = ? AND lang = ? ORDER BY sort_order ASC',
    [diseaseId, preferredLang]
  );

  // Fallback if preferred language is empty
  if (rows.length === 0) {
    return await db.getAllAsync<SuggestedQuestionRecord>(
      'SELECT * FROM suggested_questions WHERE disease_id = ? ORDER BY sort_order ASC',
      [diseaseId]
    );
  }

  return rows;
}

/**
 * Retrieve build metadata from knowledge.db (e.g. embedding_dim, schema_version).
 */
export async function getKnowledgeMeta(key: string): Promise<string | null> {
  const db = getKnowledgeDb();
  const row = await db.getFirstAsync<KnowledgeMeta>('SELECT value FROM meta WHERE key = ? LIMIT 1', [
    key,
  ]);
  return row ? row.value : null;
}
