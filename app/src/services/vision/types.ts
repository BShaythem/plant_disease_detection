// src/services/vision/types.ts

export interface TopKPrediction {
  classLabel: string;
  confidence: number; // 0 to 100 percentage
}

export interface VisionPrediction {
  classLabel: string; // 'Healthy' | 'aculus_olive' | 'olivepeacockspot'
  confidence: number; // 0 to 100
  topK: TopKPrediction[];
  latencyMs: number;
  status: 'healthy' | 'infected';
  diseaseName: string; // User-facing name (e.g. 'Peacock spot', 'Healthy Olive Foliage')
}
