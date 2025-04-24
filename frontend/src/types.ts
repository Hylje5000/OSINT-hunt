// Define common types used throughout the application
export interface Report {
  id: number;
  name: string;
  source: string;
  iocs: IoC[];
  sigma_rule?: string;
  created_at: string;
  updated_at: string;
}

export interface IoC {
  type: string;
  value: string;
  description?: string;
}

export interface HuntingQuery {
  id: number;
  name: string;
  description?: string;
  query_type: string;
  query_text: string;
  iocs?: IoC[];
  ioc_value?: string;
  ioc_type?: string;
  report_id?: number;
  created_at: string;
  updated_at: string;
}