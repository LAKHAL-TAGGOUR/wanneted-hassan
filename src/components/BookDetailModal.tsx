import React, { useState } from 'react';
import { X, ExternalLink, Calendar, BookOpen, Copy, Check, Library, Tag } from 'lucide-react';
import { ReadingLogEntry, ShelfType } from '../types';
import {
  formatLoggedDate,
  getCoverUrl,
  getOpenLibraryUrl,
  SHELVES_META,
  ImageSize,
  buildAuthorPhotoUrl,
} from '../utils';

interface BookDetailModalProps {
  entry: ReadingLogEntry | null;
  shelf?: ShelfType;
  onClose: () => void;
  onSearchInsideBook?: (itemId: string, title?: string) => void;
}

export const BookDetailModal: React.FC<BookDetailModalProps> = ({ entry, shelf, onClose, onSearchInsideBook }) => {
  const [copied, setCopied] = useState(false);
  const [copiedCoverUrl, setCopiedCoverUrl] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [coverSize, setCoverSize] = useState<ImageSize>('M');

  if (!entry) return null;

  const { work, logged_edition, logged_date } = entry;
  const coverUrl = !imgError ? getCoverUrl(work.cover_id, work.cover_edition_key, coverSize) : null;
  const shelfMeta = shelf ? SHELVES_META[shelf] : null;

  // Derive Archive.org item ID if available from lending_edition_s or logged_edition
  const candidateArchiveId = work.lending_edition_s || (logged_edition ? logged_edition.replace('/books/', '') : null);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(entry, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCoverUrl = () => {
    if (coverUrl) {
      navigator.clipboard.writeText(coverUrl);
      setCopiedCoverUrl(true);
      setTimeout(() => setCopiedCoverUrl(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        id="book-detail-modal"
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500 font-mono">
              Book Reading Log Inspector
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Cover image */}
            <div className="w-36 sm:w-44 shrink-0 mx-auto sm:mx-0 space-y-2">
              <div className="aspect-2/3 bg-stone-100 rounded-xl overflow-hidden border border-stone-300/80 shadow-md">
                {coverUrl ? (
                  <img
                    key={coverUrl}
                    src={coverUrl}
                    alt={work.title}
                    referrerPolicy="no-referrer"
                    onError={() => setImgError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full p-3 flex flex-col justify-between bg-stone-100 text-stone-600 text-center">
                    <Library className="w-8 h-8 text-stone-300 mx-auto mt-6" />
                    <div className="text-xs font-serif font-medium">{work.title}</div>
                    <span className="text-[10px] text-stone-400 font-mono">No cover available</span>
                  </div>
                )}
              </div>

              {/* Cover size switcher (S / M / L) */}
              <div className="flex items-center justify-between gap-1 p-1 bg-stone-100 rounded-lg text-[10px] font-mono">
                <span className="text-stone-400 px-1">Size:</span>
                <div className="flex items-center gap-1">
                  {(['S', 'M', 'L'] as ImageSize[]).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => {
                        setCoverSize(sz);
                        setImgError(false);
                      }}
                      className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                        coverSize === sz
                          ? 'bg-white font-bold text-stone-900 shadow-2xs'
                          : 'text-stone-500 hover:text-stone-900'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              {coverUrl && (
                <button
                  type="button"
                  onClick={handleCopyCoverUrl}
                  className="w-full py-1 px-1.5 text-[10px] font-mono text-stone-500 hover:text-stone-900 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  title="Copy direct covers.openlibrary.org URL"
                >
                  {copiedCoverUrl ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCoverUrl ? 'Copied Cover URL' : 'Copy Cover URL'}</span>
                </button>
              )}
            </div>

            {/* Book Info */}
            <div className="flex-1 space-y-3">
              {shelfMeta && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-stone-50">
                  <Tag className="w-3 h-3 text-stone-400" />
                  <span className={shelfMeta.badgeText}>Shelf: {shelfMeta.label}</span>
                </div>
              )}

              <h2 className="text-xl sm:text-2xl font-bold font-serif text-stone-900 leading-tight">
                {work.title}
              </h2>

              {/* Authors */}
              <div className="text-sm text-stone-700">
                <span className="text-stone-400 text-xs block mb-0.5">Author(s):</span>
                {work.author_names?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {work.author_names.map((author, idx) => {
                      const authorKey = work.author_keys?.[idx];
                      const authorPhotoUrl = authorKey
                        ? buildAuthorPhotoUrl({ key: 'olid', value: authorKey, size: 'S', defaultFalse: true })
                        : null;

                      return authorKey ? (
                        <a
                          key={authorKey}
                          href={getOpenLibraryUrl(authorKey)}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="inline-flex items-center gap-1.5 text-amber-800 hover:text-amber-950 font-medium hover:underline bg-stone-50 hover:bg-stone-100 px-2 py-0.5 rounded-lg border border-stone-200"
                        >
                          {authorPhotoUrl && (
                            <img
                              src={authorPhotoUrl}
                              alt=""
                              referrerPolicy="no-referrer"
                              className="w-4 h-4 rounded-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          )}
                          <span>{author}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span key={author} className="font-medium">{author}</span>
                      );
                    })}
                  </div>
                ) : (
                  <span className="italic text-stone-400">Unknown Author</span>
                )}
              </div>

              {/* Metadata list */}
              <div className="grid grid-cols-2 gap-3 pt-2 text-xs border-t border-stone-100 font-mono">
                <div>
                  <span className="text-stone-400 block text-[11px] font-sans">First Published</span>
                  <span className="font-semibold text-stone-800">{work.first_publish_year || 'Unknown'}</span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[11px] font-sans">Date Logged</span>
                  <span className="font-semibold text-stone-800">{formatLoggedDate(logged_date)}</span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[11px] font-sans">Open Library Work</span>
                  <a
                    href={getOpenLibraryUrl(work.key)}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-amber-700 hover:underline flex items-center gap-1"
                  >
                    <span>{work.key.replace('/works/', '')}</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <div>
                  <span className="text-stone-400 block text-[11px] font-sans">Logged Edition</span>
                  {logged_edition ? (
                    <a
                      href={getOpenLibraryUrl(logged_edition)}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-amber-700 hover:underline flex items-center gap-1"
                    >
                      <span>{logged_edition.replace('/books/', '')}</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  ) : (
                    <span className="text-stone-400">—</span>
                  )}
                </div>
              </div>

              {/* Action Buttons with Courtesy link */}
              <div className="pt-3 flex flex-wrap gap-2">
                <a
                  href={getOpenLibraryUrl(work.key)}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-stone-900 text-white hover:bg-stone-800 transition-colors flex items-center gap-1.5"
                >
                  <span>Open Library Page (Courtesy Link)</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                {work.lending_edition_s && (
                  <a
                    href={`https://archive.org/details/${work.lending_edition_s}`}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-1.5"
                  >
                    <span>Borrow / Read on Archive.org</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}

                {onSearchInsideBook && candidateArchiveId && (
                  <button
                    type="button"
                    onClick={() => {
                      onSearchInsideBook(candidateArchiveId, work.title);
                      onClose();
                    }}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Search Inside Book (OCR)</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Raw JSON viewer */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-stone-500">
              <span className="font-semibold font-mono">Raw API Reading Log Entry</span>
              <button
                onClick={handleCopyJson}
                className="flex items-center gap-1 text-stone-600 hover:text-stone-900 px-2 py-0.5 rounded bg-stone-100 hover:bg-stone-200 transition-colors font-mono text-[11px]"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy JSON'}</span>
              </button>
            </div>
            <pre className="p-3 bg-stone-900 text-stone-200 rounded-xl text-[11px] font-mono overflow-x-auto max-h-48 border border-stone-800">
              <code>{JSON.stringify(entry, null, 2)}</code>
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-stone-200 bg-stone-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
