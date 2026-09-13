export type ShelfType = 'want-to-read' | 'currently-reading' | 'already-read';

export interface OpenLibraryWork {
  title: string;
  key: string;
  author_keys?: string[];
  author_names?: string[];
  first_publish_year?: number;
  lending_edition_s?: string | null;
  edition_key?: string[];
  cover_id?: number | null;
  cover_edition_key?: string | null;
}

export interface ReadingLogEntry {
  work: OpenLibraryWork;
  logged_edition?: string | null;
  logged_date?: string | null;
}

export interface ShelfMeta {
  id: ShelfType;
  label: string;
  apiPath: string;
  badgeBg: string;
  badgeText: string;
  iconName: string;
  description: string;
}

export interface ShelfResponse {
  patron: string;
  shelf: ShelfType;
  openLibraryUrl: string;
  page: number;
  limit: number;
  numFound: number;
  reading_log_entries: ReadingLogEntry[];
  fetchedAt: string;
  error?: string;
}

export interface ShelfSummaryInfo {
  shelf: ShelfType;
  status: number;
  numFound: number;
  hasAccess: boolean;
  latestBook?: ReadingLogEntry | null;
  error?: string;
}

export interface PatronSummary {
  username: string;
  shelves: Record<ShelfType, ShelfSummaryInfo>;
  totalBooks: number;
  isAccessible: boolean;
  error?: string;
}

export type SortOption = 'recent' | 'title-asc' | 'title-desc' | 'year-desc' | 'year-asc' | 'author-asc';
export type ViewMode = 'grid' | 'table';

export interface InsideBox {
  l: number;
  t: number;
  r: number;
  b: number;
  page?: number;
}

export interface InsidePar {
  l: number;
  t: number;
  r: number;
  b: number;
  page: number;
  page_width: number;
  page_height: number;
  boxes: InsideBox[];
}

export interface InsideMatch {
  text: string;
  par: InsidePar[];
}

export interface InsideSearchResponse {
  ia: string;
  item_id: string;
  doc: string;
  hostname: string;
  path: string;
  q: string;
  page_count?: number;
  body_length?: number;
  leaf0_missing?: boolean;
  matches: InsideMatch[];
  matches_count: number;
  metadata?: {
    title?: string;
    creator?: string;
    year?: string;
    d1?: string;
    d2?: string;
    dir?: string;
    mediatype?: string;
  };
  raw_url: string;
  callback?: string;
  jsonp_preview?: string;
  fetchedAt: string;
  error?: string;
}

export interface SearchAvailability {
  status?: string;
  isbn?: string | null;
  open?: boolean;
  error?: string | null;
  browseable?: boolean;
  borrowable?: boolean;
  identifier?: string;
}

export interface SearchEditionDoc {
  key: string;
  title: string;
  language?: string[];
  ebook_access?: string;
  cover_i?: number;
  publish_date?: string[];
  publisher?: string[];
}

export interface SearchEditionsGroup {
  numFound: number;
  start: number;
  numFoundExact?: boolean;
  docs: SearchEditionDoc[];
}

export interface OpenLibrarySearchDoc {
  key: string;
  title: string;
  author_name?: string[];
  author_key?: string[];
  first_publish_year?: number;
  edition_count?: number;
  cover_i?: number;
  cover_edition_key?: string;
  has_fulltext?: boolean;
  public_scan_b?: boolean;
  ia?: string[];
  ia_collection_s?: string;
  lending_edition_s?: string;
  lending_identifier_s?: string;
  ratings_average?: number;
  ratings_count?: number;
  language?: string[];
  subject?: string[];
  availability?: SearchAvailability;
  editions?: SearchEditionsGroup;
}

export interface OpenLibrarySearchResponse {
  start: number;
  numFound: number;
  num_found?: number;
  numFoundExact?: boolean;
  docs: OpenLibrarySearchDoc[];
  targetUrl?: string;
  durationMs?: number;
  cached?: boolean;
  fetchedAt?: string;
  error?: string;
}

export interface OpenLibraryAuthorDoc {
  key: string;
  name: string;
  birth_date?: string;
  death_date?: string;
  top_work?: string;
  work_count?: number;
  top_subjects?: string[];
  _version_?: number;
}
