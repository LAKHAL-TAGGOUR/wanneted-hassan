import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  OpenLibrarySearchDoc,
  OpenLibrarySearchResponse,
  OpenLibraryAuthorDoc,
} from '../types';
import {
  Search,
  BookOpen,
  Filter,
  Code2,
  ExternalLink,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Sparkles,
  Layers,
  Globe,
  Star,
  Calendar,
  User,
  ShieldCheck,
  FileText,
  AlertCircle,
  Clock,
  ArrowUpDown,
  BookMarked,
  Library,
} from 'lucide-react';
import { buildBookCoverUrl, buildAuthorPhotoUrl } from '../utils';

interface SearchApiExplorerProps {
  onSearchInside?: (itemId: string, title?: string) => void;
  initialQuery?: string;
}

type SearchEndpoint = 'works' | 'authors';

interface SearchPreset {
  id: string;
  label: string;
  description: string;
  endpoint: SearchEndpoint;
  params: {
    q?: string;
    title?: string;
    author?: string;
    fields?: string;
    sort?: string;
    lang?: string;
    limit?: number;
  };
}

const SEARCH_PRESETS: SearchPreset[] = [
  {
    id: 'lotr',
    label: 'The Lord of the Rings',
    description: 'Classic work search returning editions, IA scans, and metadata',
    endpoint: 'works',
    params: {
      q: 'the lord of the rings',
      fields: 'key,title,author_name,author_key,first_publish_year,edition_count,cover_i,has_fulltext,ia,public_scan_b,ratings_average',
      sort: '',
      lang: '',
      limit: 12,
    },
  },
  {
    id: 'hp-avail',
    label: 'Harry Potter + Availability',
    description: 'Demonstrates IA availability status (fields=*,availability)',
    endpoint: 'works',
    params: {
      q: 'harry potter',
      fields: 'key,title,author_name,cover_i,ia,has_fulltext,edition_count,first_publish_year,availability',
      sort: '',
      lang: '',
      limit: 10,
    },
  },
  {
    id: 'dostoevsky-editions',
    label: 'Crime & Punishment + Editions',
    description: 'Demonstrates fetching matching editions sub-object with language & ebook_access',
    endpoint: 'works',
    params: {
      q: 'crime and punishment',
      fields: 'key,title,author_name,cover_i,first_publish_year,editions,editions.key,editions.title,editions.ebook_access,editions.language',
      sort: '',
      lang: '',
      limit: 8,
    },
  },
  {
    id: 'sherlock-french',
    label: 'Sherlock Holmes (French Lang)',
    description: 'Demonstrates lang=fr user preference influencing edition selection',
    endpoint: 'works',
    params: {
      q: 'sherlock holmes',
      fields: 'key,title,author_name,cover_i,first_publish_year,editions,editions.key,editions.title,editions.language,editions.ebook_access',
      sort: '',
      lang: 'fr',
      limit: 8,
    },
  },
  {
    id: 'sherlock-solr-filter',
    label: 'Sherlock (language:fre filter)',
    description: 'Excludes all works/editions that do not have a French edition',
    endpoint: 'works',
    params: {
      q: 'sherlock holmes language:fre',
      fields: 'key,title,author_name,cover_i,first_publish_year,language',
      sort: '',
      lang: '',
      limit: 8,
    },
  },
  {
    id: 'tolkien-newest',
    label: 'Tolkien (Sort: Newest)',
    description: 'Author search with sort=new facet',
    endpoint: 'works',
    params: {
      author: 'tolkien',
      fields: 'key,title,author_name,first_publish_year,cover_i,edition_count',
      sort: 'new',
      lang: '',
      limit: 10,
    },
  },
  {
    id: 'twain-authors',
    label: 'Mark Twain (Authors API)',
    description: 'Searches the /search/authors.json endpoint',
    endpoint: 'authors',
    params: {
      q: 'twain',
      limit: 8,
    },
  },
];

const AVAILABLE_FIELDS = [
  { id: 'key', label: 'key', description: 'Work or Book OLID' },
  { id: 'title', label: 'title', description: 'Primary work title' },
  { id: 'author_name', label: 'author_name', description: 'List of authors' },
  { id: 'author_key', label: 'author_key', description: 'Author OLIDs for author photos' },
  { id: 'first_publish_year', label: 'first_publish_year', description: 'Year first published' },
  { id: 'cover_i', label: 'cover_i', description: 'Cover image ID for covers.openlibrary.org' },
  { id: 'edition_count', label: 'edition_count', description: 'Total editions cataloged' },
  { id: 'has_fulltext', label: 'has_fulltext', description: 'Fulltext searchable flag' },
  { id: 'public_scan_b', label: 'public_scan_b', description: 'Public domain scan available' },
  { id: 'ia', label: 'ia', description: 'Internet Archive item IDs' },
  { id: 'availability', label: 'availability', description: 'Live lending/borrow availability data' },
  { id: 'editions', label: 'editions', description: 'Nested matching editions sub-object' },
  { id: 'ratings_average', label: 'ratings_average', description: 'Average rating 1-5' },
];

export const SearchApiExplorer: React.FC<SearchApiExplorerProps> = ({
  onSearchInside,
  initialQuery = 'the lord of the rings',
}) => {
  // Query state
  const [endpoint, setEndpoint] = useState<SearchEndpoint>('works');
  const [query, setQuery] = useState<string>(initialQuery);
  const [titleQuery, setTitleQuery] = useState<string>('');
  const [authorQuery, setAuthorQuery] = useState<string>('');
  const [selectedFields, setSelectedFields] = useState<string[]>(() => [
    'key',
    'title',
    'author_name',
    'author_key',
    'first_publish_year',
    'cover_i',
    'edition_count',
    'has_fulltext',
    'ia',
    'availability',
  ]);
  const [useAllFields, setUseAllFields] = useState<boolean>(false);
  const [includeEditionsSubObject, setIncludeEditionsSubObject] = useState<boolean>(false);
  const [sortFacet, setSortFacet] = useState<string>('');
  const [langCode, setLangCode] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(12);

  // Response state
  const [results, setResults] = useState<OpenLibrarySearchResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);
  const [showJsonInspector, setShowJsonInspector] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'cards' | 'json'>('cards');
  const [expandedEditions, setExpandedEditions] = useState<Record<string, boolean>>({});

  // Construct target Open Library search URL
  const targetApiUrl = useMemo(() => {
    const basePath = endpoint === 'authors' ? 'https://openlibrary.org/search/authors.json' : 'https://openlibrary.org/search.json';
    const params = new URLSearchParams();

    if (query.trim()) params.set('q', query.trim());
    if (titleQuery.trim()) params.set('title', titleQuery.trim());
    if (authorQuery.trim()) params.set('author', authorQuery.trim());

    if (endpoint === 'works') {
      if (useAllFields) {
        if (selectedFields.includes('availability')) {
          params.set('fields', '*,availability');
        } else {
          params.set('fields', '*');
        }
      } else {
        const fieldsList = [...selectedFields];
        if (includeEditionsSubObject) {
          if (!fieldsList.includes('editions')) fieldsList.push('editions');
          fieldsList.push('editions.key', 'editions.title', 'editions.ebook_access', 'editions.language');
        }
        if (fieldsList.length > 0) {
          params.set('fields', fieldsList.join(','));
        }
      }

      if (sortFacet) params.set('sort', sortFacet);
      if (langCode) params.set('lang', langCode);
    }

    if (page > 1) params.set('page', String(page));
    if (limit !== 10) params.set('limit', String(limit));

    return `${basePath}?${params.toString()}`;
  }, [
    endpoint,
    query,
    titleQuery,
    authorQuery,
    useAllFields,
    selectedFields,
    includeEditionsSubObject,
    sortFacet,
    langCode,
    page,
    limit,
  ]);

  // Execute Search
  const executeSearch = useCallback(async () => {
    if (!query.trim() && !titleQuery.trim() && !authorQuery.trim()) {
      setError('Please provide a search term (query, title, or author).');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('endpoint', endpoint);
      if (query.trim()) params.set('q', query.trim());
      if (titleQuery.trim()) params.set('title', titleQuery.trim());
      if (authorQuery.trim()) params.set('author', authorQuery.trim());

      if (endpoint === 'works') {
        if (useAllFields) {
          params.set('fields', selectedFields.includes('availability') ? '*,availability' : '*');
        } else {
          const fieldsList = [...selectedFields];
          if (includeEditionsSubObject) {
            if (!fieldsList.includes('editions')) fieldsList.push('editions');
            fieldsList.push('editions.key', 'editions.title', 'editions.ebook_access', 'editions.language');
          }
          if (fieldsList.length > 0) {
            params.set('fields', fieldsList.join(','));
          }
        }
        if (sortFacet) params.set('sort', sortFacet);
        if (langCode) params.set('lang', langCode);
      }

      params.set('page', String(page));
      params.set('limit', String(limit));

      const res = await fetch(`/api/openlibrary-search?${params.toString()}`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Search request failed with status ${res.status}`);
      }

      const data: OpenLibrarySearchResponse = await res.json();
      setResults(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred during search.');
    } finally {
      setLoading(false);
    }
  }, [
    endpoint,
    query,
    titleQuery,
    authorQuery,
    useAllFields,
    selectedFields,
    includeEditionsSubObject,
    sortFacet,
    langCode,
    page,
    limit,
  ]);

  // Trigger search on mount
  useEffect(() => {
    executeSearch();
  }, [executeSearch]);

  const handleApplyPreset = (preset: SearchPreset) => {
    setEndpoint(preset.endpoint);
    setQuery(preset.params.q || '');
    setTitleQuery(preset.params.title || '');
    setAuthorQuery(preset.params.author || '');
    setSortFacet(preset.params.sort || '');
    setLangCode(preset.params.lang || '');
    setPage(1);

    if (preset.params.fields) {
      if (preset.params.fields.startsWith('*')) {
        setUseAllFields(true);
      } else {
        setUseAllFields(false);
        const split = preset.params.fields.split(',');
        setSelectedFields(split.filter((f) => !f.startsWith('editions.')));
        setIncludeEditionsSubObject(split.some((f) => f.startsWith('editions')));
      }
    }
  };

  const handleToggleField = (fieldId: string) => {
    setSelectedFields((prev) =>
      prev.includes(fieldId) ? prev.filter((f) => f !== fieldId) : [...prev, fieldId]
    );
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(targetApiUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleCopyJson = () => {
    if (results) {
      navigator.clipboard.writeText(JSON.stringify(results, null, 2));
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    }
  };

  const toggleEditionExpand = (workKey: string) => {
    setExpandedEditions((prev) => ({
      ...prev,
      [workKey]: !prev[workKey],
    }));
  };

  const totalHits = results?.numFound ?? results?.num_found ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalHits / limit));

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero Explanation */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-100 text-amber-900">
                <Search className="w-4 h-4" />
              </span>
              <h2 className="text-xl font-bold font-serif text-stone-900 tracking-tight">
                Open Library Search API Explorer
              </h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
                /search.json
              </span>
            </div>
            <p className="text-xs text-stone-600 max-w-3xl">
              Query millions of books and works with Solr parameters, Solr field selection, real-time Internet Archive availability status, language edition preferences, and nested edition docs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://openlibrary.org/dev/docs/api/search"
              target="_blank"
              rel="noreferrer noopener"
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors flex items-center gap-1.5 border border-stone-200 cursor-pointer"
            >
              <span>Search API Docs</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <a
              href="https://github.com/internetarchive/openlibrary/blob/b4afa14b0981ae1785c26c71908af99b879fa975/openlibrary/plugins/worksearch/schemes/works.py#L38-L91"
              target="_blank"
              rel="noreferrer noopener"
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors flex items-center gap-1.5 border border-stone-200 cursor-pointer"
            >
              <span>Solr Schema</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Quick Presets Carousel */}
        <div className="mt-4 pt-4 border-t border-stone-100">
          <div className="text-[11px] font-mono text-stone-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-amber-600" />
            <span>Official & Documented Query Examples</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {SEARCH_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className="px-2.5 py-1.5 rounded-lg text-xs bg-stone-50 hover:bg-amber-50 text-stone-700 hover:text-amber-900 border border-stone-200 hover:border-amber-300 transition-all text-left cursor-pointer flex items-center gap-1.5"
                title={preset.description}
              >
                <span className="font-semibold">{preset.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Query Formulation & Controls Card */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
        {/* Endpoint selector & Primary Solr Query Bar */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="w-full md:w-44 shrink-0">
            <label className="block text-xs font-mono font-medium text-stone-500 mb-1">
              API Endpoint
            </label>
            <select
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value as SearchEndpoint)}
              className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-stone-50 border border-stone-200 text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 cursor-pointer"
            >
              <option value="works">/search.json (Works)</option>
              <option value="authors">/search/authors.json</option>
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-xs font-mono font-medium text-stone-500 mb-1">
              Solr Query parameter (<code className="text-amber-700">q</code>)
            </label>
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && executeSearch()}
                placeholder="e.g. the lord of the rings, crime and punishment, sherlock holmes language:fre"
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div className="w-full md:w-auto flex items-end">
            <button
              type="button"
              onClick={() => {
                setPage(1);
                executeSearch();
              }}
              disabled={loading}
              className="w-full md:w-auto px-5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 transition-all"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>Execute Search</span>
            </button>
          </div>
        </div>

        {/* Targeted fields: title & author & Solr facets */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-stone-100">
          <div>
            <label className="block text-[11px] font-mono font-medium text-stone-500 mb-1">
              Title Filter (<code className="text-amber-700">title=</code>)
            </label>
            <input
              type="text"
              value={titleQuery}
              onChange={(e) => setTitleQuery(e.target.value)}
              placeholder="e.g. The Lord of the Rings"
              className="w-full px-3 py-1.5 text-xs rounded-lg bg-stone-50 border border-stone-200 text-stone-800 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono font-medium text-stone-500 mb-1">
              Author Filter (<code className="text-amber-700">author=</code>)
            </label>
            <input
              type="text"
              value={authorQuery}
              onChange={(e) => setAuthorQuery(e.target.value)}
              placeholder="e.g. tolkien"
              className="w-full px-3 py-1.5 text-xs rounded-lg bg-stone-50 border border-stone-200 text-stone-800 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {endpoint === 'works' && (
            <>
              <div>
                <label className="block text-[11px] font-mono font-medium text-stone-500 mb-1">
                  Sort Facet (<code className="text-amber-700">sort=</code>)
                </label>
                <select
                  value={sortFacet}
                  onChange={(e) => setSortFacet(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-mono rounded-lg bg-stone-50 border border-stone-200 text-stone-800 focus:outline-hidden focus:ring-1 focus:ring-amber-500 cursor-pointer"
                >
                  <option value="">Relevance (default)</option>
                  <option value="new">new (Newest published)</option>
                  <option value="old">old (Oldest published)</option>
                  <option value="editions">editions (Most editions count)</option>
                  <option value="rating">rating (Highest user rating)</option>
                  <option value="random">random (Random shuffle)</option>
                  <option value="key">key (Alphabetic string key)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-medium text-stone-500 mb-1">
                  User Language (<code className="text-amber-700">lang=</code>)
                </label>
                <select
                  value={langCode}
                  onChange={(e) => setLangCode(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-mono rounded-lg bg-stone-50 border border-stone-200 text-stone-800 focus:outline-hidden focus:ring-1 focus:ring-amber-500 cursor-pointer"
                >
                  <option value="">Any / Not specified</option>
                  <option value="en">en (English edition preference)</option>
                  <option value="fr">fr (French edition preference)</option>
                  <option value="es">es (Spanish edition preference)</option>
                  <option value="de">de (German edition preference)</option>
                  <option value="it">it (Italian edition preference)</option>
                  <option value="ru">ru (Russian edition preference)</option>
                  <option value="ja">ja (Japanese edition preference)</option>
                </select>
              </div>
            </>
          )}
        </div>

        {/* Solr Fields Selector */}
        {endpoint === 'works' && (
          <div className="pt-3 border-t border-stone-100 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold text-stone-700 uppercase tracking-wider">
                  Solr Fields (<code className="text-amber-700">fields=</code>)
                </span>
                <span className="text-[11px] text-stone-500">
                  Select fields to return from Solr or request all fields
                </span>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs font-mono text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useAllFields}
                    onChange={(e) => setUseAllFields(e.target.checked)}
                    className="rounded border-stone-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <span>Fetch all (<code className="text-amber-700">fields=*</code>)</span>
                </label>

                <label className="flex items-center gap-1.5 text-xs font-mono text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeEditionsSubObject}
                    onChange={(e) => setIncludeEditionsSubObject(e.target.checked)}
                    className="rounded border-amber-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <span>Include Editions sub-object (<code className="text-amber-700">editions.*</code>)</span>
                </label>
              </div>
            </div>

            {!useAllFields && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {AVAILABLE_FIELDS.map((field) => {
                  const isChecked = selectedFields.includes(field.id);
                  return (
                    <button
                      key={field.id}
                      type="button"
                      onClick={() => handleToggleField(field.id)}
                      className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors flex items-center gap-1 border cursor-pointer ${
                        isChecked
                          ? 'bg-amber-100/70 border-amber-300 text-amber-900 font-semibold'
                          : 'bg-stone-100 border-stone-200 text-stone-500 hover:text-stone-800'
                      }`}
                      title={field.description}
                    >
                      <span>{field.label}</span>
                      {isChecked && <Check className="w-3 h-3 text-amber-700" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Generated API URL Inspector Bar */}
        <div className="pt-2">
          <div className="bg-stone-900 rounded-xl p-3 text-stone-300 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs font-mono">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="px-2 py-0.5 rounded bg-amber-500 text-stone-950 font-bold uppercase tracking-wider text-[10px] shrink-0">
                GET
              </span>
              <span className="truncate text-stone-200">{targetApiUrl}</span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopyUrl}
                className="px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                title="Copy API URL"
              >
                {copiedUrl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedUrl ? 'Copied' : 'Copy URL'}</span>
              </button>
              <a
                href={targetApiUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                title="Open directly in new tab"
              >
                <span>Raw API</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Results Header with View Toggle & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-xl p-3 border border-stone-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="text-xs font-serif font-bold text-stone-800">
            {loading ? (
              <span className="flex items-center gap-2 text-amber-700">
                <Loader2 className="w-4 h-4 animate-spin" /> Querying Open Library Solr...
              </span>
            ) : (
              <span>
                Found <strong>{totalHits.toLocaleString()}</strong> results
                {results?.durationMs !== undefined && (
                  <span className="text-stone-400 font-mono font-normal ml-2 text-[11px]">
                    ({results.durationMs}ms {results.cached ? '• cached' : ''})
                  </span>
                )}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-stone-100 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTab('cards')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'cards' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <BookMarked className="w-3.5 h-3.5" />
              <span>Catalog View</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('json')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'json' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <Code2 className="w-3.5 h-3.5 text-amber-600" />
              <span>Raw JSON ({results?.docs?.length || 0} docs)</span>
            </button>
          </div>

          <select
            value={limit}
            onChange={(e) => {
              setLimit(parseInt(e.target.value, 10));
              setPage(1);
            }}
            className="px-2.5 py-1 text-xs font-mono rounded-lg bg-stone-50 border border-stone-200 text-stone-700 cursor-pointer"
          >
            <option value={8}>8 per page</option>
            <option value={12}>12 per page</option>
            <option value={24}>24 per page</option>
            <option value={50}>50 per page</option>
          </select>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold">Search request failed</div>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Main Content: Catalog View vs JSON View */}
      {activeTab === 'json' ? (
        <div className="bg-stone-900 rounded-2xl border border-stone-800 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs text-stone-400 font-mono pb-2 border-b border-stone-800">
            <span>Solr Response Document JSON</span>
            <button
              type="button"
              onClick={handleCopyJson}
              className="px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs flex items-center gap-1 cursor-pointer transition-colors"
            >
              {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedJson ? 'Copied' : 'Copy JSON'}</span>
            </button>
          </div>
          <pre className="text-xs text-stone-200 font-mono overflow-x-auto max-h-[600px] p-2 leading-relaxed selection:bg-amber-800">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      ) : (
        <div className="space-y-6">
          {results?.docs && results.docs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.docs.map((doc, idx) => {
                const docKey = doc.key || `doc-${idx}`;
                const hasIA = doc.ia && doc.ia.length > 0;
                const candidateIA = hasIA ? doc.ia![0] : null;
                const isEditionsExpanded = Boolean(expandedEditions[docKey]);
                const authorNames = doc.author_name?.join(', ') || 'Unknown author';
                const authorKey = doc.author_key?.[0];
                const coverUrl = doc.cover_i
                  ? buildBookCoverUrl({ key: 'id', value: doc.cover_i, size: 'M', defaultFalse: true })
                  : doc.cover_edition_key
                  ? buildBookCoverUrl({ key: 'olid', value: doc.cover_edition_key, size: 'M', defaultFalse: true })
                  : null;
                const authorPhotoUrl = authorKey
                  ? buildAuthorPhotoUrl({ key: 'olid', value: authorKey, size: 'S', defaultFalse: true })
                  : null;

                return (
                  <div
                    key={docKey}
                    className="bg-white rounded-2xl border border-stone-200 p-4 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-shadow relative"
                  >
                    <div className="space-y-3">
                      {/* Top row: Cover & Core Work Info */}
                      <div className="flex gap-3">
                        {/* Cover Image */}
                        <div className="w-20 h-28 bg-stone-100 rounded-lg border border-stone-200 overflow-hidden shrink-0 flex items-center justify-center">
                          {coverUrl ? (
                            <img
                              src={coverUrl}
                              alt={doc.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <BookOpen className="w-6 h-6 text-stone-300" />
                          )}
                        </div>

                        {/* Title & Author Info */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <h3 className="font-serif font-bold text-stone-900 text-sm leading-snug line-clamp-2">
                            {doc.title}
                          </h3>

                          <div className="flex items-center gap-1.5 text-xs text-stone-600">
                            {authorPhotoUrl && (
                              <img
                                src={authorPhotoUrl}
                                alt=""
                                referrerPolicy="no-referrer"
                                className="w-4 h-4 rounded-full object-cover border border-stone-200"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            )}
                            <span className="truncate">{authorNames}</span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-stone-500 font-mono">
                            {doc.first_publish_year && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>{doc.first_publish_year}</span>
                              </span>
                            )}
                            {doc.edition_count !== undefined && (
                              <span>• {doc.edition_count} eds</span>
                            )}
                            {doc.ratings_average && (
                              <span className="flex items-center gap-0.5 text-amber-700 font-bold">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                                <span>{doc.ratings_average.toFixed(1)}</span>
                              </span>
                            )}
                          </div>

                          {/* Work Key badge */}
                          <div className="pt-0.5">
                            <a
                              href={`https://openlibrary.org${doc.key.startsWith('/') ? doc.key : `/${doc.key}`}`}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="inline-flex items-center gap-1 text-[10px] font-mono text-stone-500 hover:text-amber-800 bg-stone-50 hover:bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200 transition-colors"
                            >
                              <span>{doc.key}</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* Availability & Scans Flags */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-stone-100 text-[10px] font-mono">
                        {doc.has_fulltext && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold flex items-center gap-1">
                            <ShieldCheck className="w-2.5 h-2.5" />
                            <span>Fulltext</span>
                          </span>
                        )}

                        {doc.public_scan_b && (
                          <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 font-semibold">
                            Public Scan
                          </span>
                        )}

                        {doc.availability && (
                          <span
                            className={`px-1.5 py-0.5 rounded border font-semibold ${
                              doc.availability.status === 'borrow_available' || doc.availability.borrowable
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                : doc.availability.status === 'open' || doc.availability.open
                                ? 'bg-blue-100 text-blue-900 border-blue-300'
                                : 'bg-stone-100 text-stone-700 border-stone-200'
                            }`}
                          >
                            IA: {doc.availability.status || (doc.availability.open ? 'Open Access' : 'Checked')}
                          </span>
                        )}
                      </div>

                      {/* Internet Archive IA IDs + 1-Click Search Inside OCR */}
                      {hasIA && (
                        <div className="bg-stone-50 rounded-xl p-2.5 border border-stone-200 space-y-2">
                          <div className="flex items-center justify-between text-[11px] font-mono text-stone-600">
                            <span className="flex items-center gap-1">
                              <Library className="w-3 h-3 text-amber-700" />
                              <span>IA Item: <strong>{candidateIA}</strong></span>
                            </span>
                            {doc.ia!.length > 1 && (
                              <span className="text-[10px] text-stone-400">+{doc.ia!.length - 1} more</span>
                            )}
                          </div>

                          {onSearchInside && candidateIA && (
                            <button
                              type="button"
                              onClick={() => onSearchInside(candidateIA, doc.title)}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                              title="Search inside this book with OCR fulltext API"
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                              <span>Search Inside Book (OCR)</span>
                            </button>
                          )}
                        </div>
                      )}

                      {/* Nested Editions Sub-Object Display (if requested and returned) */}
                      {doc.editions && doc.editions.docs && doc.editions.docs.length > 0 && (
                        <div className="pt-2 border-t border-stone-100 space-y-1.5">
                          <button
                            type="button"
                            onClick={() => toggleEditionExpand(docKey)}
                            className="w-full text-left text-xs font-mono font-semibold text-stone-700 hover:text-stone-900 flex items-center justify-between cursor-pointer py-1"
                          >
                            <span className="flex items-center gap-1 text-amber-800">
                              <Layers className="w-3.5 h-3.5" />
                              <span>Matching Editions ({doc.editions.numFound})</span>
                            </span>
                            <span className="text-[11px] text-stone-400">
                              {isEditionsExpanded ? 'Hide' : 'Expand'}
                            </span>
                          </button>

                          {isEditionsExpanded && (
                            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                              {doc.editions.docs.map((ed, edIdx) => (
                                <div
                                  key={ed.key || edIdx}
                                  className="p-2 rounded-lg bg-stone-50 border border-stone-200 text-xs space-y-1"
                                >
                                  <div className="font-medium text-stone-800 line-clamp-1">
                                    {ed.title}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-stone-500">
                                    <span className="text-amber-800 font-semibold">{ed.key}</span>
                                    {ed.language && ed.language.length > 0 && (
                                      <span className="px-1 rounded bg-stone-200 text-stone-700">
                                        {ed.language.join(', ')}
                                      </span>
                                    )}
                                    {ed.ebook_access && (
                                      <span className="px-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                                        {ed.ebook_access}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : !loading ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-stone-200 space-y-3">
              <Search className="w-10 h-10 text-stone-300 mx-auto" />
              <h3 className="font-serif font-bold text-stone-700 text-base">
                No matching books found in Solr
              </h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Try adjusting your search query, clearing specific title or author restrictions, or select one of the official query presets above.
              </p>
            </div>
          ) : null}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-stone-200 text-xs text-stone-600 bg-white p-3 rounded-xl border">
              <div className="flex items-center gap-2">
                <span>
                  Page <strong>{page}</strong> of <strong>{totalPages}</strong>
                </span>
                <span className="text-stone-300">•</span>
                <span>
                  Showing up to <strong>{limit}</strong> per page
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    setPage((p) => Math.max(1, p - 1));
                    window.scrollTo({ top: 200, behavior: 'smooth' });
                  }}
                  disabled={page <= 1 || loading}
                  className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="px-3 py-1 font-mono font-semibold bg-white border border-stone-200 rounded-lg">
                  {page}
                </span>

                <button
                  onClick={() => {
                    setPage((p) => Math.min(totalPages, p + 1));
                    window.scrollTo({ top: 200, behavior: 'smooth' });
                  }}
                  disabled={page >= totalPages || loading}
                  className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
