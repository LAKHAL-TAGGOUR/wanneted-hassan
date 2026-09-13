import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { ShelfTabs } from './components/ShelfTabs';
import { BookCard, BookRow } from './components/BookCard';
import { BookDetailModal } from './components/BookDetailModal';
import { ApiInspectorModal } from './components/ApiInspectorModal';
import { PatronAuthModal } from './components/PatronAuthModal';
import { OverviewStats } from './components/OverviewStats';
import { InsideBookSearch } from './components/InsideBookSearch';
import { SearchApiExplorer } from './components/SearchApiExplorer';
import { CoverApiExplorer } from './components/CoverApiExplorer';
import {
  PatronSummary,
  ReadingLogEntry,
  ShelfResponse,
  ShelfType,
  SortOption,
  ViewMode,
} from './types';
import { SHELVES_META } from './utils';
import { AlertCircle, BookOpen, ChevronLeft, ChevronRight, Loader2, RefreshCw, Key, ExternalLink, Code2, Search, Sparkles } from 'lucide-react';

export default function App() {
  const [appMode, setAppMode] = useState<'reading-logs' | 'search-api' | 'covers-api' | 'inside-search'>('reading-logs');
  const [insideBookItemId, setInsideBookItemId] = useState<string>('designevaluation25clin');
  const [insideBookQuery, setInsideBookQuery] = useState<string>('"library science"');

  const [patron, setPatron] = useState<string>('mekBot');
  const [selectedShelf, setSelectedShelf] = useState<ShelfType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOption, setSortOption] = useState<SortOption>('recent');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Authentication cookie
  const [authCookie, setAuthCookie] = useState<string>(() => {
    return localStorage.getItem('openlibrary_auth_cookie') || '';
  });

  // Summary state
  const [summary, setSummary] = useState<PatronSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState<boolean>(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // Shelf data state
  const [shelfData, setShelfData] = useState<ShelfResponse | null>(null);
  const [shelfLoading, setShelfLoading] = useState<boolean>(false);
  const [shelfError, setShelfError] = useState<string | null>(null);

  // All shelves aggregated preview (when 'all' is selected)
  const [allShelvesEntries, setAllShelvesEntries] = useState<Array<{ entry: ReadingLogEntry; shelf: ShelfType }>>([]);
  const [allLoading, setAllLoading] = useState<boolean>(false);

  // Pagination for individual shelf
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(24);

  // Modals
  const [selectedBook, setSelectedBook] = useState<{ entry: ReadingLogEntry; shelf?: ShelfType } | null>(null);
  const [isApiInspectorOpen, setIsApiInspectorOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Update localStorage when authCookie changes
  const handleSaveAuthCookie = (cookie: string) => {
    setAuthCookie(cookie);
    if (cookie) {
      localStorage.setItem('openlibrary_auth_cookie', cookie);
    } else {
      localStorage.removeItem('openlibrary_auth_cookie');
    }
  };

  // Fetch Patron Summary
  const fetchSummary = useCallback(async (username: string) => {
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const headers: Record<string, string> = {};
      if (authCookie) {
        headers['x-openlibrary-cookie'] = authCookie;
      }
      const res = await fetch(`/api/reading-log-summary/${encodeURIComponent(username)}`, { headers });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Server responded with ${res.status}`);
      }
      const data: PatronSummary = await res.json();
      setSummary(data);
    } catch (err: any) {
      setSummaryError(err.message || 'Failed to load patron summary');
    } finally {
      setSummaryLoading(false);
    }
  }, [authCookie]);

  // Fetch Specific Shelf
  const fetchShelf = useCallback(async (username: string, shelf: ShelfType, p: number, l: number) => {
    setShelfLoading(true);
    setShelfError(null);
    try {
      const headers: Record<string, string> = {};
      if (authCookie) {
        headers['x-openlibrary-cookie'] = authCookie;
      }
      const res = await fetch(
        `/api/reading-log/${encodeURIComponent(username)}/${shelf}?page=${p}&limit=${l}`,
        { headers }
      );
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Failed to fetch shelf (${res.status})`);
      }
      const data: ShelfResponse = await res.json();
      setShelfData(data);
    } catch (err: any) {
      setShelfError(err.message || 'Failed to fetch shelf books');
    } finally {
      setShelfLoading(false);
    }
  }, [authCookie]);

  // Fetch preview for 'all' shelves
  const fetchAllShelvesPreview = useCallback(async (username: string) => {
    setAllLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (authCookie) {
        headers['x-openlibrary-cookie'] = authCookie;
      }
      const shelves: ShelfType[] = ['currently-reading', 'already-read', 'want-to-read'];
      const results = await Promise.allSettled(
        shelves.map(async (s) => {
          const res = await fetch(`/api/reading-log/${encodeURIComponent(username)}/${s}?page=1&limit=12`, { headers });
          if (!res.ok) return [];
          const data: ShelfResponse = await res.json();
          return (data.reading_log_entries || []).map((entry) => ({ entry, shelf: s }));
        })
      );

      const combined: Array<{ entry: ReadingLogEntry; shelf: ShelfType }> = [];
      results.forEach((r) => {
        if (r.status === 'fulfilled') {
          combined.push(...r.value);
        }
      });
      setAllShelvesEntries(combined);
    } catch {
      // ignore
    } finally {
      setAllLoading(false);
    }
  }, [authCookie]);

  // Load summary and shelf on patron or auth changes
  useEffect(() => {
    fetchSummary(patron);
    setPage(1);
  }, [patron, authCookie, fetchSummary]);

  useEffect(() => {
    if (selectedShelf === 'all') {
      fetchAllShelvesPreview(patron);
    } else {
      fetchShelf(patron, selectedShelf, page, limit);
    }
  }, [patron, selectedShelf, page, limit, authCookie, fetchShelf, fetchAllShelvesPreview]);

  // Filter & Sort entries
  const displayedEntries = useMemo(() => {
    let items: Array<{ entry: ReadingLogEntry; shelf: ShelfType }> = [];

    if (selectedShelf === 'all') {
      items = [...allShelvesEntries];
    } else if (shelfData?.reading_log_entries) {
      items = shelfData.reading_log_entries.map((entry) => ({
        entry,
        shelf: selectedShelf,
      }));
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      items = items.filter(({ entry }) => {
        const titleMatch = entry.work.title?.toLowerCase().includes(q);
        const authorMatch = entry.work.author_names?.some((a) => a.toLowerCase().includes(q));
        const yearMatch = entry.work.first_publish_year?.toString().includes(q);
        return titleMatch || authorMatch || yearMatch;
      });
    }

    // Sorting
    return items.sort((a, b) => {
      if (sortOption === 'recent') {
        const dateA = a.entry.logged_date || '';
        const dateB = b.entry.logged_date || '';
        return dateB.localeCompare(dateA);
      }
      if (sortOption === 'title-asc') {
        return (a.entry.work.title || '').localeCompare(b.entry.work.title || '');
      }
      if (sortOption === 'title-desc') {
        return (b.entry.work.title || '').localeCompare(a.entry.work.title || '');
      }
      if (sortOption === 'year-desc') {
        const yearA = a.entry.work.first_publish_year || 0;
        const yearB = b.entry.work.first_publish_year || 0;
        return yearB - yearA;
      }
      if (sortOption === 'year-asc') {
        const yearA = a.entry.work.first_publish_year || 9999;
        const yearB = b.entry.work.first_publish_year || 9999;
        return yearA - yearB;
      }
      if (sortOption === 'author-asc') {
        const authA = a.entry.work.author_names?.[0] || '';
        const authB = b.entry.work.author_names?.[0] || '';
        return authA.localeCompare(authB);
      }
      return 0;
    });
  }, [selectedShelf, allShelvesEntries, shelfData, searchQuery, sortOption]);

  const totalPages = useMemo(() => {
    if (selectedShelf === 'all') return 1;
    const count = shelfData?.numFound || 0;
    return Math.max(1, Math.ceil(count / limit));
  }, [selectedShelf, shelfData, limit]);

  const handleRefresh = () => {
    fetchSummary(patron);
    if (selectedShelf === 'all') {
      fetchAllShelvesPreview(patron);
    } else {
      fetchShelf(patron, selectedShelf, page, limit);
    }
  };

  const handleSearchInsideBook = (itemId: string, _title?: string) => {
    setInsideBookItemId(itemId);
    setAppMode('inside-search');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans">
      {/* App Header */}
      <Header
        currentPatron={patron}
        onSelectPatron={(newPatron) => {
          setPatron(newPatron);
          setSelectedShelf('all');
          setAppMode('reading-logs');
        }}
        onOpenApiInspector={() => setIsApiInspectorOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        isAuthenticated={Boolean(authCookie)}
        onRefresh={handleRefresh}
        isLoading={summaryLoading || shelfLoading || allLoading}
        appMode={appMode}
        onSwitchAppMode={setAppMode}
      />

      {appMode === 'search-api' ? (
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6">
          <SearchApiExplorer onSearchInside={handleSearchInsideBook} />
        </main>
      ) : appMode === 'covers-api' ? (
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6">
          <CoverApiExplorer />
        </main>
      ) : appMode === 'inside-search' ? (
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6">
          <InsideBookSearch
            key={insideBookItemId}
            initialItemId={insideBookItemId}
            initialQuery={insideBookQuery}
          />
        </main>
      ) : (
        <>
          {/* Shelf Filter and Controls Toolbar */}
          <ShelfTabs
            selectedShelf={selectedShelf}
            onSelectShelf={(s) => {
              setSelectedShelf(s);
              setPage(1);
            }}
            summary={summary}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sortOption={sortOption}
            onSortChange={setSortOption}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />

          {/* Main Content Area */}
          <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6">
        
        {/* Patron Overview Stats (Visible when 'all' is selected or on top) */}
        {selectedShelf === 'all' && (
          <OverviewStats
            summary={summary}
            patron={patron}
            onSelectShelf={(shelf) => {
              setSelectedShelf(shelf);
              setPage(1);
            }}
            onOpenApiInspector={() => setIsApiInspectorOpen(true)}
          />
        )}

        {/* Shelf Heading when a specific shelf is active */}
        {selectedShelf !== 'all' && (
          <div className="bg-white rounded-xl p-4 border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-wider text-stone-400">
                  Viewing Shelf
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${SHELVES_META[selectedShelf].badgeBg} border`}>
                  {SHELVES_META[selectedShelf].label}
                </span>
              </div>
              <h2 className="text-xl font-bold font-serif text-stone-900 mt-1">
                {SHELVES_META[selectedShelf].label} ({shelfData?.numFound ?? 0} books)
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                {SHELVES_META[selectedShelf].description}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsApiInspectorOpen(true)}
                className="px-3 py-1.5 text-xs font-mono rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Code2 className="w-3.5 h-3.5 text-amber-600" />
                <span>books/{SHELVES_META[selectedShelf].apiPath}</span>
              </button>
            </div>
          </div>
        )}

        {/* Error States */}
        {summaryError && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 text-xs">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-semibold">Unable to retrieve patron reading log</div>
              <p>{summaryError}</p>
              <div className="pt-2 flex items-center gap-3 font-sans">
                <button
                  onClick={() => setPatron('mekBot')}
                  className="px-2.5 py-1 bg-amber-200/80 hover:bg-amber-300 rounded font-medium text-amber-950 transition-colors cursor-pointer"
                >
                  Switch to sample patron (mekBot)
                </button>
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="px-2.5 py-1 bg-white border border-amber-300 hover:bg-stone-50 rounded font-medium text-stone-800 transition-colors cursor-pointer"
                >
                  Configure Patron Auth
                </button>
              </div>
            </div>
          </div>
        )}

        {shelfError && selectedShelf !== 'all' && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3 text-xs">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-semibold">Reading Log Shelf Restricted or Not Found</div>
              <p>{shelfError}</p>
              <p className="text-[11px] text-rose-700">
                If this patron’s account is private, you can provide an Open Library session cookie via Patron Authentication to access it.
              </p>
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {(summaryLoading || shelfLoading || allLoading) && (
          <div className="py-16 flex flex-col items-center justify-center text-stone-400 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
            <p className="text-xs font-mono">Fetching reading log entries from Open Library...</p>
          </div>
        )}

        {/* Books List / Grid */}
        {!(summaryLoading || shelfLoading || allLoading) && (
          <>
            {displayedEntries.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-stone-200 space-y-3">
                <BookOpen className="w-10 h-10 text-stone-300 mx-auto" />
                <h3 className="font-serif font-bold text-stone-700 text-base">
                  No books found in this view
                </h3>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  {searchQuery
                    ? `No titles or authors matching "${searchQuery}". Try clearing your search filter.`
                    : 'This patron currently has no books logged on this shelf or the log is empty.'}
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 transition-colors cursor-pointer"
                  >
                    Clear Search Filter
                  </button>
                )}
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedEntries.map(({ entry, shelf }) => (
                  <BookCard
                    key={`${entry.work.key}-${entry.logged_edition || ''}-${entry.logged_date || ''}`}
                    entry={entry}
                    shelf={shelf}
                    onSelectBook={(selected, s) => setSelectedBook({ entry: selected, shelf: s })}
                    onSearchInside={handleSearchInsideBook}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-100/80 border-b border-stone-200 text-[11px] font-semibold text-stone-600 font-mono uppercase tracking-wider">
                      <th className="py-2.5 px-3 w-12">Cover</th>
                      <th className="py-2.5 px-3">Title & Author</th>
                      <th className="py-2.5 px-3 hidden sm:table-cell">Published</th>
                      <th className="py-2.5 px-3 hidden md:table-cell">Shelf</th>
                      <th className="py-2.5 px-3 hidden lg:table-cell">Logged Date</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedEntries.map(({ entry, shelf }) => (
                      <BookRow
                        key={`${entry.work.key}-${entry.logged_edition || ''}-${entry.logged_date || ''}`}
                        entry={entry}
                        shelf={shelf}
                        onSelectBook={(selected, s) => setSelectedBook({ entry: selected, shelf: s })}
                        onSearchInside={handleSearchInsideBook}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls for Specific Shelf */}
            {selectedShelf !== 'all' && totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-stone-200 text-xs text-stone-600">
                <div className="flex items-center gap-2">
                  <span>Showing page <strong>{page}</strong> of <strong>{totalPages}</strong></span>
                  <span className="text-stone-300">•</span>
                  <span>Total: <strong>{shelfData?.numFound || 0}</strong> books</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    disabled={page <= 1}
                    className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    aria-label="Previous Page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  <span className="px-3 py-1 font-mono font-semibold bg-white border border-stone-200 rounded-lg">
                    {page}
                  </span>

                  <button
                    onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={page >= totalPages}
                    className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    aria-label="Next Page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

      </main>
      </>
      )}

      {/* Footer info banner */}
      <footer className="mt-auto border-t border-stone-200 bg-white py-6 text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-600" />
              <span className="font-serif font-semibold text-stone-800">
                Open Library Reading Log & Covers Explorer
              </span>
              <span className="text-stone-400">•</span>
              <span>Data & images powered by <a href="https://openlibrary.org" target="_blank" rel="noreferrer" className="underline hover:text-stone-900">openlibrary.org</a> & <a href="https://archive.org" target="_blank" rel="noreferrer" className="underline hover:text-stone-900">archive.org</a></span>
            </div>

            <div className="flex items-center gap-3 font-mono text-[11px]">
              <button
                onClick={() => setIsApiInspectorOpen(true)}
                className="text-amber-800 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>API Endpoints</span>
                <ExternalLink className="w-3 h-3" />
              </button>
              <span>•</span>
              <a
                href="https://openlibrary.org/dev/docs/api/covers"
                target="_blank"
                rel="noreferrer noopener"
                className="hover:text-stone-800 hover:underline"
              >
                Cover API Guidelines
              </a>
              <span>•</span>
              <a
                href="https://openlibrary.org/developers/api"
                target="_blank"
                rel="noreferrer noopener"
                className="hover:text-stone-800 hover:underline"
              >
                Open Library API Docs
              </a>
            </div>
          </div>

          <div className="pt-2.5 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-stone-400">
            <span>
              Book covers and author photographs are rendered directly from <code className="text-stone-700 bg-stone-100 px-1 py-0.5 rounded font-mono">covers.openlibrary.org</code>. Courtesy links to Open Library work/edition records are provided on all items. No crawling or scraping is performed.
            </span>
            <span>
              Bulk downloads available on <a href="https://archive.org/details/olcovers" target="_blank" rel="noreferrer" className="underline hover:text-stone-600">Archive.org (olcovers)</a>
            </span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {selectedBook && (
        <BookDetailModal
          entry={selectedBook.entry}
          shelf={selectedBook.shelf}
          onClose={() => setSelectedBook(null)}
          onSearchInsideBook={handleSearchInsideBook}
        />
      )}

      {isApiInspectorOpen && (
        <ApiInspectorModal
          patron={patron}
          initialShelf={selectedShelf === 'all' ? 'want-to-read' : selectedShelf}
          authCookie={authCookie}
          onClose={() => setIsApiInspectorOpen(false)}
        />
      )}

      {isAuthModalOpen && (
        <PatronAuthModal
          authCookie={authCookie}
          onSaveAuthCookie={handleSaveAuthCookie}
          onClose={() => setIsAuthModalOpen(false)}
        />
      )}
    </div>
  );
}
