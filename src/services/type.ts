export interface CreateWorksheetData {
  title: string;
  description?: string;
  cover_uri: any;
  published_date: Date;
  coming_from: string;
  lecturer: string;
  file_uri: any;
  status: boolean;
}

export interface ApiResponse<T> {
  current_page: number;
  data: T[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: Link[];
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

export interface Worksheet {
  id: number;
  title: string;
  description: string;
  cover_uri: string;
  published_date: string;
  coming_from: string;
  lecturer: string;
  file_uri: string;
  status: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Link {
  url: string | null;
  label: string;
  active: boolean;
}
