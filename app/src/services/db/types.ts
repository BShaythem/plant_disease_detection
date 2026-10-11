// src/services/db/types.ts
// Database types matching schema_knowledge.sql and schema_app.sql

// --- knowledge.db types ---
export interface KnowledgeMeta {
  key: string;
  value: string;
}

export interface DiseaseRecord {
  id: string;
  class_label: string;
  name_fr: string;
  name_ar: string | null;
  name_en: string | null;
  scientific_name: string | null;
  plant_id: string | null;
}

export interface DiseaseDocRecord {
  disease_id: string;
  lang: string;
  content_md: string;
  updated_at: string;
}

export interface SuggestedQuestionRecord {
  id: string;
  disease_id: string;
  lang: string;
  question_text: string;
  sort_order: number;
}

// --- app.db types ---
export interface SessionRecord {
  id: string;
  title: string | null;
  created_at: number; // unix ms
  updated_at: number;
}

export interface ImageRecord {
  id: string;
  session_id: string;
  rel_path: string;
  width: number | null;
  height: number | null;
  created_at: number;
}

export interface DiagnosisRecord {
  id: string;
  image_id: string;
  class_label: string;
  confidence: number;
  topk_json: string | null;
  model_version: string;
  latency_ms: number | null;
  created_at: number;
}

export interface MessageRecord {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tier: number | null; // 1 = card lookup, 2 = RAG, null = user
  image_id: string | null;
  model_id: string | null;
  latency_ms: number | null;
  created_at: number;
}

export interface SettingRecord {
  key: string;
  value: string;
}

// Aggregated View for Scan History (sessions + images + diagnoses)
export interface ScanHistoryItem {
  sessionId: string;
  diagnosisId: string;
  imageId: string;
  imageUri: string;
  classLabel: string;
  diseaseName: string;
  confidence: number;
  createdAt: number;
  status: 'healthy' | 'infected';
}
