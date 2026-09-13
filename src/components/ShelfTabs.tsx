import React from 'react';
import { Bookmark, BookOpen, CheckCircle2, LayoutGrid, List, Search, SlidersHorizontal, Layers } from 'lucide-react';
import { PatronSummary, ShelfType, SortOption, ViewMode } from '../types';
import { SHELVES_META } from '../utils';

interface ShelfTabsProps {
  selectedShelf: ShelfType | 'all';
  onSelectShelf: (shelf: ShelfType | 'all') => void;
  summary: PatronSummary | null;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  sortOption: SortOption;
  onSortChange: (sort: SortOption) => void;
  viewMode: ViewMode;
  onViewModeChange: (m: ViewMode) => void;
}

export const ShelfTabs: React.FC<ShelfTabsProps> = ({
  selectedShelf,
  onSelectShelf,
  summary,
  searchQuery,
  onSearchChange,
  sortOption,
  onSortChange,
  viewMode,
  onViewModeChange,
}) => {
  const getCount = (shelf: ShelfType) => {
    return summary?.shelves?.[shelf]?.numFound ?? 0;
  };

  const totalAll = summary ? summary.totalBooks : 0;

  return (
    <div id="shelf-controls" className="bg-white border-b border-stone-200 sticky top-[69px] z-20 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {/* Overview / All */}
            <button
              id="tab-all-shelves"
              onClick={() => onSelectShelf('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                selectedShelf === 'all'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All Shelves</span>
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full font-mono ${
                  selectedShelf === 'all'
                    ? 'bg-stone-800 text-stone-300'
                    : 'bg-stone-200 text-stone-700'
                }`}
              >
                {totalAll}
              </span>
            </button>

            {/* Want to Read */}
            <button
              id="tab-want-to-read"
              onClick={() => onSelectShelf('want-to-read')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                selectedShelf === 'want-to-read'
                  ? 'bg-amber-800 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Want to Read</span>
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full font-mono ${
                  selectedShelf === 'want-to-read'
                    ? 'bg-amber-900/60 text-amber-200'
                    : 'bg-amber-100 text-amber-900'
                }`}
              >
                {getCount('want-to-read')}
              </span>
            </button>

            {/* Currently Reading */}
            <button
              id="tab-currently-reading"
              onClick={() => onSelectShelf('currently-reading')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                selectedShelf === 'currently-reading'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Currently Reading</span>
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full font-mono ${
                  selectedShelf === 'currently-reading'
                    ? 'bg-emerald-900/60 text-emerald-200'
                    : 'bg-emerald-100 text-emerald-900'
                }`}
              >
                {getCount('currently-reading')}
              </span>
            </button>

            {/* Already Read */}
            <button
              id="tab-already-read"
              onClick={() => onSelectShelf('already-read')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                selectedShelf === 'already-read'
                  ? 'bg-indigo-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Already Read</span>
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full font-mono ${
                  selectedShelf === 'already-read'
                    ? 'bg-indigo-950/60 text-indigo-200'
                    : 'bg-indigo-100 text-indigo-900'
                }`}
              >
                {getCount('already-read')}
              </span>
            </button>
          </div>

          {/* Search, Sort & View Controls */}
          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                id="shelf-filter-input"
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Filter titles or authors..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-600/30 focus:border-amber-600 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-stone-400 hover:text-stone-600"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-1 text-xs">
              <SlidersHorizontal className="w-3.5 h-3.5 text-stone-400 hidden sm:block" />
              <select
                id="shelf-sort-select"
                value={sortOption}
                onChange={(e) => onSortChange(e.target.value as SortOption)}
                aria-label="Sort books by"
                className="py-1.5 px-2 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-700 focus:outline-hidden focus:ring-2 focus:ring-amber-600/30"
              >
                <option value="recent">Recently Logged</option>
                <option value="title-asc">Title (A-Z)</option>
                <option value="title-desc">Title (Z-A)</option>
                <option value="year-desc">Year (Newest)</option>
                <option value="year-asc">Year (Oldest)</option>
                <option value="author-asc">Author Name</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-stone-100 p-0.5 rounded-lg border border-stone-200">
              <button
                id="view-mode-grid"
                onClick={() => onViewModeChange('grid')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-500 hover:text-stone-700'
                }`}
                title="Grid View"
                aria-label="Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                id="view-mode-table"
                onClick={() => onViewModeChange('table')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-500 hover:text-stone-700'
                }`}
                title="List View"
                aria-label="List View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
