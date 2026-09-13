import React from 'react';
import { Bookmark, BookOpen, CheckCircle2, TrendingUp, Calendar, UserCheck, ExternalLink, Code2 } from 'lucide-react';
import { PatronSummary, ReadingLogEntry, ShelfType } from '../types';
import { formatLoggedDate, getOpenLibraryUrl } from '../utils';

interface OverviewStatsProps {
  summary: PatronSummary | null;
  patron: string;
  onSelectShelf: (shelf: ShelfType) => void;
  onOpenApiInspector: () => void;
}

export const OverviewStats: React.FC<OverviewStatsProps> = ({
  summary,
  patron,
  onSelectShelf,
  onOpenApiInspector,
}) => {
  if (!summary) return null;

  const total = summary.totalBooks || 0;
  const wantCount = summary.shelves['want-to-read']?.numFound || 0;
  const currCount = summary.shelves['currently-reading']?.numFound || 0;
  const readCount = summary.shelves['already-read']?.numFound || 0;

  const wantPercent = total > 0 ? Math.round((wantCount / total) * 100) : 0;
  const currPercent = total > 0 ? Math.round((currCount / total) * 100) : 0;
  const readPercent = total > 0 ? Math.round((readCount / total) * 100) : 0;

  const latestWant = summary.shelves['want-to-read']?.latestBook;
  const latestCurr = summary.shelves['currently-reading']?.latestBook;
  const latestRead = summary.shelves['already-read']?.latestBook;

  return (
    <div id="patron-overview-stats" className="space-y-4">
      {/* Patron Hero Card */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-stone-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-semibold">
                Open Library Patron Reading Log
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif text-stone-100 flex items-center gap-2">
              <span>{patron}</span>
              <a
                href={`https://openlibrary.org/people/${encodeURIComponent(patron)}`}
                target="_blank"
                rel="noreferrer noopener"
                className="text-stone-400 hover:text-white transition-colors"
                title="View Open Library profile"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </h2>
            <p className="text-stone-400 text-xs sm:text-sm mt-1 max-w-xl">
              Publicly accessible reading collection spanning <strong>{total}</strong> catalogued works on Open Library.
            </p>
          </div>

          {/* Aggregate counts */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <div className="px-4 py-2.5 rounded-xl bg-stone-800/80 border border-stone-700/80 text-center">
              <div className="text-xl sm:text-2xl font-bold font-mono text-amber-400">
                {total}
              </div>
              <div className="text-[10px] sm:text-xs text-stone-400 font-medium uppercase tracking-wider">
                Total Logged
              </div>
            </div>

            <button
              onClick={onOpenApiInspector}
              className="px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Code2 className="w-4 h-4" />
              <span>Inspect APIs</span>
            </button>
          </div>
        </div>

        {/* Shelf distribution progress bar */}
        {total > 0 && (
          <div className="mt-5 pt-4 border-t border-stone-800 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-stone-400 font-mono">
              <span>Shelf Distribution:</span>
              <span>{readCount} read • {currCount} current • {wantCount} want</span>
            </div>
            <div className="h-2 w-full bg-stone-800 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${readPercent}%` }}
                className="bg-indigo-500 transition-all duration-500"
                title={`Already Read: ${readCount} (${readPercent}%)`}
              />
              <div
                style={{ width: `${currPercent}%` }}
                className="bg-emerald-500 transition-all duration-500"
                title={`Currently Reading: ${currCount} (${currPercent}%)`}
              />
              <div
                style={{ width: `${wantPercent}%` }}
                className="bg-amber-500 transition-all duration-500"
                title={`Want to Read: ${wantCount} (${wantPercent}%)`}
              />
            </div>
          </div>
        )}
      </div>

      {/* 3 Interactive Shelf Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Want to Read Card */}
        <div
          onClick={() => onSelectShelf('want-to-read')}
          className="bg-white rounded-xl border border-stone-200 hover:border-amber-400/80 p-4 transition-all hover:shadow-sm cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-50 text-amber-900 border border-amber-200/60">
                  <Bookmark className="w-4 h-4" />
                </div>
                <h3 className="font-serif font-bold text-stone-900 text-sm">Want to Read</h3>
              </div>
              <span className="text-base font-bold font-mono text-amber-900 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                {wantCount}
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-2 line-clamp-2">
              Planned reads and wishlist entries recorded by this patron.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 text-xs">
            {latestWant?.work ? (
              <div className="text-stone-700">
                <span className="text-[10px] uppercase font-mono text-stone-400 block">Latest Addition:</span>
                <span className="font-medium font-serif line-clamp-1">{latestWant.work.title}</span>
                <span className="text-stone-400 text-[11px] font-mono">
                  {latestWant.work.author_names?.[0] || 'Unknown Author'}
                </span>
              </div>
            ) : (
              <span className="text-stone-400 italic text-[11px]">No entries loaded</span>
            )}
          </div>
        </div>

        {/* Currently Reading Card */}
        <div
          onClick={() => onSelectShelf('currently-reading')}
          className="bg-white rounded-xl border border-stone-200 hover:border-emerald-400/80 p-4 transition-all hover:shadow-sm cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200/60">
                  <BookOpen className="w-4 h-4" />
                </div>
                <h3 className="font-serif font-bold text-stone-900 text-sm">Currently Reading</h3>
              </div>
              <span className="text-base font-bold font-mono text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                {currCount}
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-2 line-clamp-2">
              Books actively being read by the patron at this moment.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 text-xs">
            {latestCurr?.work ? (
              <div className="text-stone-700">
                <span className="text-[10px] uppercase font-mono text-stone-400 block">In Progress:</span>
                <span className="font-medium font-serif line-clamp-1">{latestCurr.work.title}</span>
                <span className="text-stone-400 text-[11px] font-mono">
                  {latestCurr.work.author_names?.[0] || 'Unknown Author'}
                </span>
              </div>
            ) : (
              <span className="text-stone-400 italic text-[11px]">No active books</span>
            )}
          </div>
        </div>

        {/* Already Read Card */}
        <div
          onClick={() => onSelectShelf('already-read')}
          className="bg-white rounded-xl border border-stone-200 hover:border-indigo-400/80 p-4 transition-all hover:shadow-sm cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-900 border border-indigo-200/60">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <h3 className="font-serif font-bold text-stone-900 text-sm">Already Read</h3>
              </div>
              <span className="text-base font-bold font-mono text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200/60">
                {readCount}
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-2 line-clamp-2">
              Completed books archived into reading history.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 text-xs">
            {latestRead?.work ? (
              <div className="text-stone-700">
                <span className="text-[10px] uppercase font-mono text-stone-400 block">Recently Finished:</span>
                <span className="font-medium font-serif line-clamp-1">{latestRead.work.title}</span>
                <span className="text-stone-400 text-[11px] font-mono">
                  {latestRead.work.author_names?.[0] || 'Unknown Author'}
                </span>
              </div>
            ) : (
              <span className="text-stone-400 italic text-[11px]">No finished books</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
