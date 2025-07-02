export interface Activity {
  id: string;
  handle: string;
  committed_on: string; // ISO date string
  tags: string[];
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}

export interface NewActivity {
  handle: string;
  committed_on: string;
  tags: string[];
}

export interface ActivityFilter {
  startDate?: string;
  endDate?: string;
  tags?: string[];
  searchText?: string;
}
