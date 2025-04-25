// Define common types used throughout the application
export interface Report {
  id: number;
  name: string;
  source: string;
  sigma_rule?: string;
  created_at: string;
  updated_at: string;
  iocs?: IoC[]; // Add the missing iocs property as an optional array of IoC
}

export interface IoC {
  id: number;
  type: string;
  value: string;
  description?: string;
  source?: string;
  confidence?: number;
  created_at: string;
  updated_at: string;
}

export interface HuntingQuery {
  id: number;
  name: string;
  description?: string;
  query_type: string;
  query_text: string;
  ioc_id: number;
  created_at: string;
  updated_at: string;
}