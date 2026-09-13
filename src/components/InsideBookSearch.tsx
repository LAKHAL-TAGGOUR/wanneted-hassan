import React, { useState, useEffect } from 'react';
import {
  Search,
  BookOpen,
  ExternalLink,
  Code2,
  Copy,
  Check,
  Server,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Info,
  Sparkles,
  Layers,
  FileText
} from 'lucide-react';
import { InsideMatch, InsideSearchResponse } from '../types';

interface InsideBookSearchProps {
  initialItemId?: string;
  initialQuery?: string;
  onSelectOpenLibraryBook?: (editionKey: string) => void;
}

const PRESET_BOOKS = [
  {
    id: 'designevaluation25clin',
    title: 'Design and Evaluation of Computer/Human Interfaces',
    query: '"library science"',
    description: 'Clinic on Library Applications of Data Processing (1988)',
  },
  {
    id: 'dracula00stok',
    title: 'Dracula by Bram Stoker',
    query: '"Count Dracula"',
    description: 'First edition classic Gothic horror novel',
  },
  {
    id: 'frankensteinor00shel',
    title: 'Frankenstein by Mary Shelley',
    query: '"spark of being"',
    description: 'The 1818 classic science fiction novel',
  },
  {
    id: 'aliceinwonderlan00carruoft',
    title: "Alice's Adventures in Wonderland",
    query: '"Cheshire Cat"',
    description: 'Lewis Carroll with classic illustrations',
  },
];

export const InsideBookSearch: React.FC<InsideBookSearchProps> = ({
  initialItemId = 'designevaluation25clin',
  initialQuery = '"library science"',
}) => {
  const [itemId, setItemId] = useState(initialItemId);
  const [query, setQuery] = useState(initialQuery);
  const [customHost, setCustomHost] = useState('');
  const [customPath, setCustomPath] = useState('');
  const [customDoc, setCustomDoc] = useState('');
  const [useCallback, setUseCallback] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [searchResult, setSearchResult] = useState<InsideSearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'matches' | 'json' | 'api-docs'>('matches');
  const [copied, setCopied] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [previewBoxPage, setPreviewBoxPage] = useState<number | null>(null);

  const executeSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanItem = itemId.trim();
    const cleanQ = query.trim();
    if (!cleanItem || !cleanQ) return;

    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams({
      item_id: cleanItem,
      q: cleanQ,
    });
    if (customHost.trim()) params.set('hostname', customHost.trim());
    if (customPath.trim()) params.set('path', customPath.trim());
    if (customDoc.trim()) params.set('doc', customDoc.trim());
    if (useCallback) params.set('callback', 'reply');

    try {
      const res = await fetch(`/api/archive/search-inside?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Search failed with status ${res.status}`);
      }
      setSearchResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to execute search inside book');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    executeSearch();
  }, []);

  const handleCopyJson = () => {
    if (!searchResult) return;
    const content = useCallback && searchResult.jsonp_preview
      ? searchResult.jsonp_preview
      : JSON.stringify(searchResult, null, 2);
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyUrl = () => {
    if (!searchResult?.raw_url) return;
    navigator.clipboard.writeText(searchResult.raw_url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  // Helper to render matched text with highlights
  const renderHighlightedSnippet = (rawText: string) => {
    // Matches can be surrounded by <IA_FTS_MATCH>...</IA_FTS_MATCH> or {{{...}}}
    const parts: React.ReactNode[] = [];
    const regex = /(?:<IA_FTS_MATCH>(.*?)<\/IA_FTS_MATCH>)|(?:\{\{\{(.*?)\}\}\})/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(rawText)) !== null) {
      if (match.index > lastIndex) {
        parts.push(rawText.substring(lastIndex, match.index));
      }
      const matchedWord = match[1] || match[2] || '';
      parts.push(
        <mark
          key={match.index}
          className="bg-amber-300 text-amber-950 px-1 py-0.2 rounded font-semibold border-b border-amber-500 shadow-2xs"
        >
          {matchedWord}
        </mark>
      );
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < rawText.length) {
      parts.push(rawText.substring(lastIndex));
    }

    return parts.length > 0 ? parts : rawText;
  };

  return (
    <div id="inside-book-search-container" className="space-y-6">
      
      {/* Search Header Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-stone-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 font-semibold border border-amber-400/30">
                Experimental API
              </span>
              <span className="text-xs text-stone-400 font-mono">
                Internet Archive Fulltext / Inside Book
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-stone-100">
              Search Inside a Book (inside.php API)
            </h2>
            <p className="text-stone-400 text-xs sm:text-sm mt-1 max-w-2xl">
              Queries the distributed Archive.org datanode cluster to search the full OCR text of digitized works, returning page numbers, exact coordinate bounding boxes, and match paragraphs.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href="https://archive.org"
              target="_blank"
              rel="noreferrer noopener"
              className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-mono transition-colors flex items-center gap-1.5 border border-stone-700"
            >
              <span>Archive.org</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="mt-5 pt-4 border-t border-stone-800">
          <span className="text-[11px] font-mono text-stone-400 uppercase tracking-wider block mb-2">
            Try Example Items:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {PRESET_BOOKS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  setItemId(preset.id);
                  setQuery(preset.query);
                  setCustomHost('');
                  setCustomPath('');
                  setCustomDoc('');
                  // Trigger search with new preset
                  setTimeout(() => {
                    const btn = document.getElementById('inside-search-submit-btn');
                    btn?.click();
                  }, 50);
                }}
                className={`p-2 rounded-xl text-left border transition-all text-xs cursor-pointer ${
                  itemId === preset.id
                    ? 'bg-amber-400/15 border-amber-400/40 text-amber-200'
                    : 'bg-stone-800/60 hover:bg-stone-800 border-stone-700 text-stone-300'
                }`}
              >
                <div className="font-semibold font-serif line-clamp-1">{preset.title}</div>
                <div className="text-[10px] font-mono text-amber-400/90 mt-0.5">
                  q: {preset.query}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search Input Form */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
        <form onSubmit={executeSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Item ID */}
            <div className="md:col-span-5">
              <label className="text-xs font-semibold text-stone-700 block mb-1 font-mono">
                Archive.org Item ID:
              </label>
              <div className="relative">
                <input
                  id="inside-search-item-id"
                  type="text"
                  value={itemId}
                  onChange={(e) => setItemId(e.target.value)}
                  placeholder="e.g. designevaluation25clin"
                  className="w-full px-3 py-2 text-xs font-mono bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-600/30 focus:border-amber-600"
                  required
                />
              </div>
              <p className="text-[10px] text-stone-400 mt-1 font-mono">
                Datanode resolved via: archive.org/metadata/{'{item}'}
              </p>
            </div>

            {/* Query Phrase */}
            <div className="md:col-span-5">
              <label className="text-xs font-semibold text-stone-700 block mb-1 font-mono">
                Search Phrase (q):
              </label>
              <div className="relative">
                <input
                  id="inside-search-query-phrase"
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder='e.g. "library science" or word'
                  className="w-full px-3 py-2 text-xs font-mono bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-600/30 focus:border-amber-600"
                  required
                />
              </div>
              <p className="text-[10px] text-stone-400 mt-1 font-mono">
                Supports exact phrases in quotes (e.g. "library science")
              </p>
            </div>

            {/* Submit Button */}
            <div className="md:col-span-2 flex items-end">
              <button
                id="inside-search-submit-btn"
                type="submit"
                disabled={isLoading}
                className="w-full py-2 px-4 rounded-xl bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer h-[38px]"
              >
                <Search className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>{isLoading ? 'Searching...' : 'Search Book'}</span>
              </button>
            </div>
          </div>

          {/* Advanced options toggle */}
          <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-stone-600 hover:text-stone-900 flex items-center gap-1 cursor-pointer font-mono"
            >
              <SlidersHorizontal className="w-3 h-3" />
              <span>Datanode Locator & Advanced Parameters</span>
              {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            <label className="flex items-center gap-2 text-xs text-stone-600 font-mono cursor-pointer">
              <input
                type="checkbox"
                checked={useCallback}
                onChange={(e) => setUseCallback(e.target.checked)}
                className="rounded text-amber-600 focus:ring-amber-500"
              />
              <span>Use JSONP callback=reply</span>
            </label>
          </div>

          {/* Advanced fields */}
          {showAdvanced && (
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-3 font-mono">
              <div className="flex items-start gap-2 text-stone-600 text-[11px] leading-relaxed">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  Archive.org book files live on dynamic data node hosts (such as <code>ia800204</code>, <code>ia601508</code>, etc.). By default, our server queries <code>archive.org/metadata/{'{item}'}</code> to automatically locate the live <code>d1</code> or <code>d2</code> host and directory <code>dir</code>. You can optionally override them below:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Custom Hostname:
                  </label>
                  <input
                    type="text"
                    value={customHost}
                    onChange={(e) => setCustomHost(e.target.value)}
                    placeholder="e.g. ia800204.us.archive.org"
                    className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs"
                  />
                  <span className="text-[10px] text-stone-400">Default: auto-resolved via d1/d2</span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Custom Path:
                  </label>
                  <input
                    type="text"
                    value={customPath}
                    onChange={(e) => setCustomPath(e.target.value)}
                    placeholder="e.g. /27/items/designevaluation25clin"
                    className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs"
                  />
                  <span className="text-[10px] text-stone-400">Default: auto-resolved via metadata dir</span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Custom Doc:
                  </label>
                  <input
                    type="text"
                    value={customDoc}
                    onChange={(e) => setCustomDoc(e.target.value)}
                    placeholder="Usually same as item_id"
                    className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs"
                  />
                  <span className="text-[10px] text-stone-400">Default: item_id</span>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Datanode Resolution Status Card */}
      {searchResult && (
        <div className="bg-stone-900 text-stone-200 rounded-xl p-4 border border-stone-800 text-xs font-mono space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800 pb-2">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400 font-semibold">
                Datanode Host Resolved: {searchResult.hostname}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-stone-400">
              <span>Path: <strong className="text-stone-200">{searchResult.path}</strong></span>
              <span>•</span>
              <span>Doc: <strong className="text-stone-200">{searchResult.doc}</strong></span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 text-[11px] text-stone-400 pt-1">
            <div className="truncate">
              Target API URL: <span className="text-amber-300 select-all">{searchResult.raw_url}</span>
            </div>
            <button
              onClick={handleCopyUrl}
              className="text-stone-300 hover:text-white flex items-center gap-1 shrink-0 cursor-pointer"
            >
              {copiedUrl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedUrl ? 'Copied' : 'Copy URL'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs space-y-1">
          <div className="font-semibold">Search Inside Book API Error</div>
          <p>{error}</p>
        </div>
      )}

      {/* Search Results Navigation Tabs */}
      {searchResult && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-stone-200 pb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('matches')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === 'matches'
                    ? 'bg-stone-900 text-white'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                Search Matches ({searchResult.matches_count})
              </button>

              <button
                onClick={() => setActiveTab('json')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer font-mono ${
                  activeTab === 'json'
                    ? 'bg-stone-900 text-white'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                Raw API Response {useCallback ? '(JSONP)' : '(JSON)'}
              </button>

              <button
                onClick={() => setActiveTab('api-docs')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === 'api-docs'
                    ? 'bg-stone-900 text-white'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                API Specification
              </button>
            </div>

            <div className="text-xs text-stone-500 font-mono hidden sm:block">
              Item: <strong>{searchResult.ia}</strong> • Query: <strong>{searchResult.q}</strong>
            </div>
          </div>

          {/* TAB 1: Search Matches */}
          {activeTab === 'matches' && (
            <div className="space-y-4">
              {searchResult.matches.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center border border-stone-200 space-y-2">
                  <FileText className="w-8 h-8 text-stone-300 mx-auto" />
                  <h4 className="font-serif font-bold text-stone-700 text-sm">No matches found</h4>
                  <p className="text-xs text-stone-500">
                    No OCR text occurrences of "{query}" found in "{itemId}". Try another word or check spelling.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {searchResult.matches.map((match, idx) => {
                    const primaryPar = match.par?.[0];
                    const pageNum = primaryPar?.page;
                    const bookReaderUrl = pageNum
                      ? `https://archive.org/details/${encodeURIComponent(searchResult.ia)}/page/${pageNum}/mode/2up?q=${encodeURIComponent(query.replace(/"/g, ''))}`
                      : `https://archive.org/details/${encodeURIComponent(searchResult.ia)}`;

                    return (
                      <div
                        key={idx}
                        className="bg-white rounded-xl border border-stone-200 hover:border-stone-400 p-4 transition-all shadow-2xs space-y-3"
                      >
                        {/* Header with Page Number & Actions */}
                        <div className="flex items-center justify-between text-xs border-b border-stone-100 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-md bg-stone-900 text-white font-mono font-bold text-xs">
                              Page {pageNum || '—'}
                            </span>

                            {primaryPar && (
                              <span className="text-[11px] font-mono text-stone-400 hidden sm:inline">
                                Size: {primaryPar.page_width}×{primaryPar.page_height}px
                              </span>
                            )}

                            {primaryPar?.boxes?.length ? (
                              <span className="text-[11px] font-mono text-stone-500 bg-stone-100 px-1.5 py-0.2 rounded">
                                {primaryPar.boxes.length} box{primaryPar.boxes.length > 1 ? 'es' : ''}
                              </span>
                            ) : null}
                          </div>

                          <div className="flex items-center gap-2">
                            <a
                              href={bookReaderUrl}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-medium flex items-center gap-1 transition-colors"
                            >
                              <span>Read Page {pageNum}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>

                        {/* Match text paragraph */}
                        <p className="text-stone-800 text-xs sm:text-sm leading-relaxed font-serif">
                          {renderHighlightedSnippet(match.text)}
                        </p>

                        {/* Coordinates and Mini Visual Overlay */}
                        {primaryPar && (
                          <div className="pt-2 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-mono text-stone-500">
                            <div className="flex flex-wrap items-center gap-2">
                              <span>
                                Paragraph Bounds: l:{primaryPar.l}, t:{primaryPar.t}, r:{primaryPar.r}, b:{primaryPar.b}
                              </span>
                            </div>

                            {/* Mini Page Position Indicator */}
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-stone-400 font-sans">Page Location:</span>
                              <div
                                className="w-10 h-14 bg-stone-100 border border-stone-300 rounded relative overflow-hidden shrink-0 shadow-2xs"
                                title={`Page ${primaryPar.page}: ${primaryPar.page_width}x${primaryPar.page_height}`}
                              >
                                {primaryPar.boxes?.map((box, bIdx) => {
                                  const leftPct = (box.l / primaryPar.page_width) * 100;
                                  const topPct = (box.t / primaryPar.page_height) * 100;
                                  const widthPct = Math.max(8, ((box.r - box.l) / primaryPar.page_width) * 100);
                                  const heightPct = Math.max(5, ((box.b - box.t) / primaryPar.page_height) * 100);
                                  return (
                                    <div
                                      key={bIdx}
                                      style={{
                                        left: `${leftPct}%`,
                                        top: `${topPct}%`,
                                        width: `${widthPct}%`,
                                        height: `${heightPct}%`,
                                      }}
                                      className="absolute bg-amber-500/80 rounded-2xs border border-amber-600"
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Raw API Response */}
          {activeTab === 'json' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-stone-600 font-mono">
                <span>
                  {useCallback ? 'JSONP Output format (reply callback):' : 'Raw JSON output payload:'}
                </span>
                <button
                  onClick={handleCopyJson}
                  className="px-2.5 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-800 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy Content'}</span>
                </button>
              </div>

              <pre className="p-4 bg-stone-950 text-emerald-300 rounded-xl text-xs font-mono overflow-x-auto max-h-[600px] border border-stone-800 leading-relaxed">
                <code>
                  {useCallback && searchResult.jsonp_preview
                    ? searchResult.jsonp_preview
                    : JSON.stringify(searchResult, null, 2)}
                </code>
              </pre>
            </div>
          )}

          {/* TAB 3: API Documentation */}
          {activeTab === 'api-docs' && (
            <div className="bg-white rounded-xl border border-stone-200 p-5 text-xs text-stone-700 space-y-4">
              <h3 className="text-sm font-bold font-serif text-stone-900">
                Internet Archive fulltext/inside.php API Specification
              </h3>

              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-2 font-mono text-[11px]">
                <div className="text-stone-500 font-semibold uppercase">Endpoint Pattern:</div>
                <div className="bg-white p-2 rounded border border-stone-200 text-stone-900 break-all select-all">
                  https://{'{hostname}'}/fulltext/inside.php?item_id={'{item_id}'}&doc={'{doc}'}&path={'{path}'}&q={'{query}'}&callback={'{callback}'}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-stone-800 font-sans">Parameters Reference:</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse font-mono text-[11px]">
                    <thead>
                      <tr className="border-b border-stone-200 text-stone-500 bg-stone-50">
                        <th className="py-2 px-3">Parameter</th>
                        <th className="py-2 px-3">Type</th>
                        <th className="py-2 px-3">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      <tr>
                        <td className="py-2 px-3 font-bold text-amber-900">hostname</td>
                        <td className="py-2 px-3 text-stone-500">string</td>
                        <td className="py-2 px-3 text-stone-600 font-sans">
                          Host where the book is stored (e.g. <code>ia601508.us.archive.org</code>). Located via <code>archive.org/metadata/{'{identifier}'}</code> (values <code>d1</code> or <code>d2</code>).
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-bold text-amber-900">item_id</td>
                        <td className="py-2 px-3 text-stone-500">string</td>
                        <td className="py-2 px-3 text-stone-600 font-sans">
                          Archive.org item ID (e.g. <code>designevaluation25clin</code>).
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-bold text-amber-900">doc</td>
                        <td className="py-2 px-3 text-stone-500">string</td>
                        <td className="py-2 px-3 text-stone-600 font-sans">
                          Target document; most times identical to <code>item_id</code>.
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-bold text-amber-900">path</td>
                        <td className="py-2 px-3 text-stone-500">string</td>
                        <td className="py-2 px-3 text-stone-600 font-sans">
                          Path of the book on this host, matching <code>dir</code> from metadata (e.g. <code>/14/items/designevaluation25clin</code>).
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-bold text-amber-900">q</td>
                        <td className="py-2 px-3 text-stone-500">string</td>
                        <td className="py-2 px-3 text-stone-600 font-sans">
                          Phrase or keywords to search for within the OCR text.
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-bold text-amber-900">callback</td>
                        <td className="py-2 px-3 text-stone-500">string (optional)</td>
                        <td className="py-2 px-3 text-stone-600 font-sans">
                          Optional JSONP callback function name (e.g. <code>reply</code>).
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-1.5 text-[11px] text-stone-600 font-sans">
                <h4 className="font-semibold text-stone-800">Match Coordinates Format:</h4>
                <p>
                  Each match returned has a <code>par</code> array containing <code>page</code>, <code>page_width</code>, <code>page_height</code>, and bounding coordinates (<code>l</code>, <code>t</code>, <code>r</code>, <code>b</code> for left, top, right, bottom) representing the exact OCR location on the scanned page.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
