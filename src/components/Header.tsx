import React, { useState } from 'react';
import { BookOpen, Search, ExternalLink, Key, Code2, Check, RefreshCw } from 'lucide-react';
import { POPULAR_PATRONS } from '../utils';

interface HeaderProps {
  currentPatron: string;
  onSelectPatron: (patron: string) => void;
  onOpenApiInspector: () => void;
  onOpenAuthModal: () => void;
  isAuthenticated: boolean;
  onRefresh: () => void;
  isLoading: boolean;
  appMode: 'reading-logs' | 'search-api' | 'covers-api' | 'inside-search';
  onSwitchAppMode: (mode: 'reading-logs' | 'search-api' | 'covers-api' | 'inside-search') => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPatron,
  onSelectPatron,
  onOpenApiInspector,
  onOpenAuthModal,
  isAuthenticated,
  onRefresh,
  isLoading,
  appMode,
  onSwitchAppMode,
}) => {
  const [inputVal, setInputVal] = useState(currentPatron);
  const [showPresets, setShowPresets] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputVal.trim();
    if (clean) {
      onSelectPatron(clean);
      setShowPresets(false);
    }
  };

  return (
    <header id="app-header" className="bg-white border-b border-stone-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          
          {/* Brand & Identity */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-stone-900 text-stone-100 flex items-center justify-center shadow-xs">
                <BookOpen className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold tracking-tight text-stone-900 font-serif">
                    Open Library Reading Log
                  </h1>
                  <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200">
                    Public API
                  </span>
                </div>
                <p className="text-xs text-stone-500">
                  Inspecting patron books & reading shelves from openlibrary.org
                </p>
              </div>
            </div>

            {/* Mobile quick actions */}
            <div className="flex items-center gap-1.5 lg:hidden">
              <button
                id="mobile-api-btn"
                onClick={onOpenApiInspector}
                className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
                title="Inspect APIs"
                aria-label="Inspect APIs"
              >
                <Code2 className="w-4 h-4" />
              </button>
              <button
                id="mobile-auth-btn"
                onClick={onOpenAuthModal}
                className={`p-2 rounded-lg transition-colors ${
                  isAuthenticated
                    ? 'text-emerald-700 bg-emerald-50'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
                title="Patron Auth Settings"
                aria-label="Patron Auth Settings"
              >
                <Key className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Center Patron Search Form */}
          <div className="relative flex-1 max-w-xl">
            <form onSubmit={handleSubmit} className="relative flex items-center">
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  id="patron-username-input"
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  onFocus={() => setShowPresets(true)}
                  placeholder="Enter Open Library patron (e.g. mekBot, edsu)..."
                  className="w-full pl-9 pr-24 py-2 text-sm bg-stone-50 hover:bg-stone-100/70 focus:bg-white border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-600/30 focus:border-amber-600 transition-all font-mono"
                />
                <div className="absolute inset-y-0 right-1 flex items-center pr-1 gap-1">
                  <button
                    id="patron-load-btn"
                    type="submit"
                    className="px-2.5 py-1 text-xs font-medium rounded-lg bg-stone-900 text-white hover:bg-stone-800 transition-colors cursor-pointer"
                  >
                    Load
                  </button>
                </div>
              </div>
            </form>

            {/* Quick Suggestions Dropdown */}
            {showPresets && (
              <div
                id="patron-presets-dropdown"
                className="absolute left-0 right-0 mt-1.5 bg-white border border-stone-200 rounded-xl shadow-lg p-2 z-40 text-xs"
              >
                <div className="flex items-center justify-between px-2 py-1 text-stone-500 font-medium">
                  <span>Suggested Patrons with Reading Logs</span>
                  <button
                    type="button"
                    onClick={() => setShowPresets(false)}
                    className="text-stone-400 hover:text-stone-600"
                  >
                    Close
                  </button>
                </div>
                <div className="mt-1 space-y-1">
                  {POPULAR_PATRONS.map((p) => (
                    <button
                      key={p.username}
                      type="button"
                      onClick={() => {
                        setInputVal(p.username);
                        onSelectPatron(p.username);
                        setShowPresets(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                        currentPatron.toLowerCase() === p.username.toLowerCase()
                          ? 'bg-amber-50 text-amber-900 font-semibold'
                          : 'hover:bg-stone-100 text-stone-700'
                      }`}
                    >
                      <div>
                        <span className="font-mono">{p.username}</span>
                        <span className="text-stone-400 ml-2">({p.label.split('(')[0].trim()})</span>
                      </div>
                      <span className="text-[11px] text-stone-400">{p.note}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action buttons on desktop */}
          <div className="hidden lg:flex items-center gap-2">
            <button
              id="refresh-log-btn"
              onClick={onRefresh}
              disabled={isLoading}
              className="px-3 py-2 text-xs font-medium text-stone-700 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors flex items-center gap-1.5 border border-stone-200 disabled:opacity-50 cursor-pointer"
              title="Refresh log data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              id="open-api-inspector-btn"
              onClick={onOpenApiInspector}
              className="px-3 py-2 text-xs font-medium text-stone-700 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors flex items-center gap-1.5 border border-stone-200 cursor-pointer"
              title="View the 3 Open Library JSON APIs"
            >
              <Code2 className="w-3.5 h-3.5 text-amber-600" />
              <span>Inspect APIs</span>
            </button>

            <button
              id="patron-auth-status-btn"
              onClick={onOpenAuthModal}
              className={`px-3 py-2 text-xs font-medium rounded-xl transition-colors flex items-center gap-1.5 border cursor-pointer ${
                isAuthenticated
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>{isAuthenticated ? 'Authenticated' : 'Public Mode'}</span>
            </button>

            <a
              id="openlibrary-profile-link"
              href={`https://openlibrary.org/people/${encodeURIComponent(currentPatron)}`}
              target="_blank"
              rel="noreferrer noopener"
              className="px-3 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors flex items-center gap-1 border border-transparent"
              title="Open patron profile on openlibrary.org"
            >
              <span>Profile</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

        </div>

        {/* Navigation Mode Switcher */}
        <div className="mt-3 pt-2.5 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-stone-100 rounded-xl">
            <button
              id="mode-reading-logs-btn"
              type="button"
              onClick={() => onSwitchAppMode('reading-logs')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                appMode === 'reading-logs'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-600" />
              <span>Patron Reading Logs</span>
            </button>

            <button
              id="mode-search-api-btn"
              type="button"
              onClick={() => onSwitchAppMode('search-api')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                appMode === 'search-api'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Search className="w-3.5 h-3.5 text-amber-400" />
              <span>Search API</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                appMode === 'search-api' ? 'bg-amber-400/20 text-amber-300' : 'bg-stone-200 text-stone-700'
              }`}>
                search.json
              </span>
            </button>

            <button
              id="mode-covers-api-btn"
              type="button"
              onClick={() => onSwitchAppMode('covers-api')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                appMode === 'covers-api'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Covers & Photos API</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                appMode === 'covers-api' ? 'bg-amber-400/20 text-amber-300' : 'bg-stone-200 text-stone-700'
              }`}>
                covers.openlibrary.org
              </span>
            </button>

            <button
              id="mode-search-inside-btn"
              type="button"
              onClick={() => onSwitchAppMode('inside-search')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                appMode === 'inside-search'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Search Inside (OCR)</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                appMode === 'inside-search' ? 'bg-amber-400/20 text-amber-300' : 'bg-stone-200 text-stone-700'
              }`}>
                inside.php
              </span>
            </button>
          </div>

          <div className="text-[11px] text-stone-400 font-mono hidden xl:block">
            {appMode === 'reading-logs' && 'Shelves: Want to Read • Currently Reading • Already Read'}
            {appMode === 'search-api' && 'Solr endpoint: q, fields, availability, editions, sort, lang'}
            {appMode === 'covers-api' && 'Direct src URLs: ISBN, OLID, Cover ID, LCCN, OCLC (S/M/L)'}
            {appMode === 'inside-search' && 'Datanode OCR fulltext API: dynamic host & coordinates'}
          </div>
        </div>
      </div>
    </header>
  );
};
