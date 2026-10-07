export interface ScanResult {
  id: string;
  imageUri: string;
  diseaseName: string;
  scientificName: string;
  confidence: number; // e.g. 94.8
  status: 'healthy' | 'infected' | 'warning';
  severity: 'None' | 'Low' | 'Moderate' | 'High';
  date: string;
  description: string;
  userNote?: string;
  symptoms: string[];
  recommendedTreatments: string[];
  preventiveMeasures: string[];
}

export interface NewsArticle {
  id: string;
  title: string;
  category: string;
  date: string;
  readTime: string;
  summary: string;
  content: string;
  author: string;
  imageUrl?: string;
  tag: string;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  farmName: string;
  region: string;
  oliveTreeCount: number;
  memberSince: string;
  avatarUri?: string;
}
