import { ShelfMeta, ShelfType } from './types';

export const SHELVES_META: Record<ShelfType, ShelfMeta> = {
  'want-to-read': {
    id: 'want-to-read',
    label: 'Want to Read',
    apiPath: 'want-to-read.json',
    badgeBg: 'bg-amber-50 border-amber-200 text-amber-900',
    badgeText: 'text-amber-800',
    iconName: 'Bookmark',
    description: 'Books the patron intends to read in the future',
  },
  'currently-reading': {
    id: 'currently-reading',
    label: 'Currently Reading',
    apiPath: 'currently-reading.json',
    badgeBg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    badgeText: 'text-emerald-800',
    iconName: 'BookOpen',
    description: 'Books the patron is actively working through right now',
  },
  'already-read': {
    id: 'already-read',
    label: 'Already Read',
    apiPath: 'already-read.json',
    badgeBg: 'bg-indigo-50 border-indigo-200 text-indigo-900',
    badgeText: 'text-indigo-800',
    iconName: 'CheckCircle2',
    description: 'Finished books logged in the patron’s history',
  },
};

export const POPULAR_PATRONS = [
  { username: 'mekBot', label: 'mekBot (Official Open Library Bot)', note: '500+ books logged across all shelves' },
  { username: 'edsu', label: 'edsu (Ed Summers)', note: 'Longtime Open Library & digital library patron' },
  { username: 'seabelis', label: 'seabelis', note: 'Curated public reading list' },
  { username: 'george08', label: 'george08', note: 'Active reader & cataloguer' },
];

export type CoverKeyType = 'id' | 'olid' | 'isbn' | 'lccn' | 'oclc';
export type AuthorKeyType = 'olid' | 'id';
export type ImageSize = 'S' | 'M' | 'L';

export interface BuildCoverOptions {
  key: CoverKeyType;
  value: string | number;
  size?: ImageSize;
  defaultFalse?: boolean;
}

export interface BuildAuthorPhotoOptions {
  key: AuthorKeyType;
  value: string | number;
  size?: ImageSize;
  defaultFalse?: boolean;
}

export function buildBookCoverUrl({
  key,
  value,
  size = 'M',
  defaultFalse = true,
}: BuildCoverOptions): string {
  const cleanVal = String(value).trim().replace(/^\/books\//, '').replace(/^\/works\//, '');
  const url = `https://covers.openlibrary.org/b/${key.toLowerCase()}/${encodeURIComponent(cleanVal)}-${size}.jpg`;
  return defaultFalse ? `${url}?default=false` : url;
}

export function buildAuthorPhotoUrl({
  key,
  value,
  size = 'M',
  defaultFalse = true,
}: BuildAuthorPhotoOptions): string {
  const cleanVal = String(value).trim().replace(/^\/authors\//, '');
  const url = `https://covers.openlibrary.org/a/${key.toLowerCase()}/${encodeURIComponent(cleanVal)}-${size}.jpg`;
  return defaultFalse ? `${url}?default=false` : url;
}

export function getCoverUrl(
  coverId?: number | null,
  editionKey?: string | null,
  size: ImageSize = 'M'
): string | null {
  if (coverId && coverId > 0) {
    return buildBookCoverUrl({ key: 'id', value: coverId, size, defaultFalse: true });
  }
  if (editionKey) {
    return buildBookCoverUrl({ key: 'olid', value: editionKey, size, defaultFalse: true });
  }
  return null;
}

export function getOpenLibraryCourtesyLink(keyType: CoverKeyType | 'work' | 'author', value: string | number): string {
  const cleanVal = String(value).trim();
  switch (keyType) {
    case 'isbn':
      return `https://openlibrary.org/isbn/${cleanVal}`;
    case 'olid':
      return cleanVal.startsWith('OL') && cleanVal.endsWith('W')
        ? `https://openlibrary.org/works/${cleanVal}`
        : `https://openlibrary.org/books/${cleanVal}`;
    case 'author':
      return `https://openlibrary.org/authors/${cleanVal}`;
    case 'work':
      return `https://openlibrary.org/works/${cleanVal.replace(/^\/works\//, '')}`;
    case 'lccn':
      return `https://openlibrary.org/search?q=${encodeURIComponent(`lccn:${cleanVal}`)}`;
    case 'oclc':
      return `https://openlibrary.org/search?q=${encodeURIComponent(`oclc:${cleanVal}`)}`;
    case 'id':
    default:
      return `https://openlibrary.org/search?q=${encodeURIComponent(cleanVal)}`;
  }
}

export function formatLoggedDate(dateStr?: string | null): string {
  if (!dateStr) return 'Unknown date';
  try {
    // Expected format: "2026/06/16, 05:40:11" or ISO
    const parts = dateStr.split(',');
    const datePart = parts[0].trim();
    const d = new Date(datePart.replace(/\//g, '-'));
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
  } catch {
    // fallback
  }
  return dateStr;
}

export function getOpenLibraryUrl(path: string): string {
  if (!path) return 'https://openlibrary.org';
  if (path.startsWith('http')) return path;
  if (path.startsWith('/')) return `https://openlibrary.org${path}`;
  return `https://openlibrary.org/${path}`;
}
