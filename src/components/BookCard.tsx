import React, { useState } from 'react';
import { Book as BookIcon, ExternalLink, Calendar, Clock, Bookmark, BookOpen, CheckCircle2, Info } from 'lucide-react';
import { ReadingLogEntry, ShelfType } from '../types';
import { formatLoggedDate, getCoverUrl, getOpenLibraryUrl, SHELVES_META } from '../utils';

interface BookCardProps {
  entry: ReadingLogEntry;
  shelf?: ShelfType;
  onSelectBook: (entry: ReadingLogEntry, shelf?: ShelfType) => void;
  onSearchInside?: (itemId: string, title?: string) => void;
}

export const BookCard: React.FC<BookCardProps> = ({ entry, shelf, onSelectBook, onSearchInside }) => {
  const [imgError, setImgError] = useState(false);
  const { work, logged_edition, logged_date } = entry;

  const candidateId = work.lending_edition_s || (logged_edition ? logged_edition.replace('/books/', '') : null);

  const coverUrl = !imgError ? getCoverUrl(work.cover_id, work.cover_edition_key, 'M') : null;
  const authorDisplay = work.author_names?.length
    ? work.author_names.join(', ')
    : 'Unknown Author';

  const shelfMeta = shelf ? SHELVES_META[shelf] : null;

  return (
    <div
      id={`book-card-${work.key.replace(/\W/g, '-')}`}
      onClick={() => onSelectBook(entry, shelf)}
      className="group bg-white rounded-xl border border-stone-200 hover:border-stone-400/80 hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden cursor-pointer"
    >
      {/* Top Shelf Tag if available */}
      {shelfMeta && (
        <div className="px-3 py-1.5 border-b border-stone-100 flex items-center justify-between text-[11px] bg-stone-50/70">
          <span className={`inline-flex items-center gap-1 font-medium ${shelfMeta.badgeText}`}>
            {shelf === 'want-to-read' && <Bookmark className="w-3 h-3" />}
            {shelf === 'currently-reading' && <BookOpen className="w-3 h-3" />}
            {shelf === 'already-read' && <CheckCircle2 className="w-3 h-3" />}
            {shelfMeta.label}
          </span>
          {logged_date && (
            <span className="text-stone-400 font-mono text-[10px]">
              {formatLoggedDate(logged_date)}
            </span>
          )}
        </div>
      )}

      {/* Main card content */}
      <div className="p-4 flex gap-4 flex-1">
        {/* Cover image or fallback */}
        <div className="w-20 sm:w-24 shrink-0">
          <div className="aspect-2/3 bg-stone-100 rounded-lg overflow-hidden border border-stone-200/80 relative shadow-xs group-hover:shadow-sm transition-shadow">
            {coverUrl ? (
              <img
                src={coverUrl}
                alt={work.title}
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full p-2 flex flex-col justify-between bg-gradient-to-br from-stone-100 to-stone-200 text-stone-600">
                <BookIcon className="w-5 h-5 text-stone-400 self-center mt-2" />
                <div className="text-[10px] font-serif line-clamp-3 text-center leading-tight font-medium text-stone-700">
                  {work.title}
                </div>
                <span className="text-[9px] text-stone-400 text-center font-mono">No Cover</span>
              </div>
            )}
          </div>
        </div>

        {/* Book Details */}
        <div className="flex-1 flex flex-col justify-between min-w-0">
          <div>
            <h3 className="font-serif font-bold text-stone-900 text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-amber-900 transition-colors">
              {work.title}
            </h3>

            <p className="text-xs text-stone-600 mt-1 line-clamp-1 font-medium">
              {authorDisplay}
            </p>

            {/* Metadata pills */}
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11px] text-stone-500">
              {work.first_publish_year && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-mono">
                  <Calendar className="w-3 h-3 text-stone-400" />
                  {work.first_publish_year}
                </span>
              )}

              {work.lending_edition_s && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-mono text-[10px]">
                  Borrowable
                </span>
              )}

              {logged_edition && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-600 font-mono text-[10px] truncate max-w-[130px]">
                  {logged_edition.replace('/books/', '')}
                </span>
              )}
            </div>
          </div>

          {/* Bottom info link */}
          <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400">
            <span className="text-[11px] group-hover:text-amber-800 transition-colors flex items-center gap-1">
              <Info className="w-3 h-3" />
              <span>Inspect details</span>
            </span>

            <div className="flex items-center gap-2">
              {onSearchInside && candidateId && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSearchInside(candidateId, work.title);
                  }}
                  className="px-2 py-0.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-mono flex items-center gap-1 cursor-pointer transition-colors"
                  title="Search inside this book with OCR fulltext API"
                >
                  <BookOpen className="w-2.5 h-2.5" />
                  <span>Search inside</span>
                </button>
              )}
              <span className="text-[11px] text-stone-400 font-mono">
                {work.edition_key?.length ? `${work.edition_key.length} eds` : ''}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const BookRow: React.FC<BookCardProps> = ({ entry, shelf, onSelectBook, onSearchInside }) => {
  const [imgError, setImgError] = useState(false);
  const { work, logged_edition, logged_date } = entry;
  const coverUrl = !imgError ? getCoverUrl(work.cover_id, work.cover_edition_key, 'S') : null;
  const authorDisplay = work.author_names?.length ? work.author_names.join(', ') : 'Unknown Author';
  const shelfMeta = shelf ? SHELVES_META[shelf] : null;
  const candidateId = work.lending_edition_s || (logged_edition ? logged_edition.replace('/books/', '') : null);

  return (
    <tr
      onClick={() => onSelectBook(entry, shelf)}
      className="border-b border-stone-100 hover:bg-amber-50/50 cursor-pointer transition-colors text-xs"
    >
      <td className="py-2.5 px-3 w-12">
        <div className="w-8 h-11 bg-stone-100 rounded border border-stone-200 overflow-hidden shrink-0">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt=""
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-stone-300">
              <BookIcon className="w-3 h-3" />
            </div>
          )}
        </div>
      </td>
      <td className="py-2.5 px-3 font-medium text-stone-900 font-serif">
        <div className="font-semibold line-clamp-1">{work.title}</div>
        <div className="text-[11px] text-stone-500 line-clamp-1 font-sans">{authorDisplay}</div>
      </td>
      <td className="py-2.5 px-3 text-stone-600 font-mono hidden sm:table-cell">
        {work.first_publish_year || '—'}
      </td>
      <td className="py-2.5 px-3 hidden md:table-cell">
        {shelfMeta ? (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${shelfMeta.badgeBg} border`}>
            {shelfMeta.label}
          </span>
        ) : (
          '—'
        )}
      </td>
      <td className="py-2.5 px-3 text-stone-500 font-mono text-[11px] hidden lg:table-cell">
        {formatLoggedDate(logged_date)}
      </td>
      <td className="py-2.5 px-3 text-right">
        <div className="flex items-center justify-end gap-1.5">
          {onSearchInside && candidateId && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSearchInside(candidateId, work.title);
              }}
              className="px-2 py-0.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-mono flex items-center gap-1 cursor-pointer transition-colors"
              title="Search inside this book"
            >
              <BookOpen className="w-2.5 h-2.5" />
              <span className="hidden sm:inline">Search inside</span>
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelectBook(entry, shelf);
            }}
            className="p-1 text-stone-400 hover:text-stone-700 rounded transition-colors"
            title="Inspect details"
            aria-label="Inspect details"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
};
