import React, { useState } from 'react';
import {
  CoverKeyType,
  AuthorKeyType,
  ImageSize,
  buildBookCoverUrl,
  buildAuthorPhotoUrl,
  getOpenLibraryCourtesyLink,
} from '../utils';
import {
  Image as ImageIcon,
  BookOpen,
  User,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Info,
  Sparkles,
  Code2,
  RefreshCw,
  Eye,
  Maximize2,
} from 'lucide-react';

interface MultiKeyExample {
  title: string;
  label: string;
  keyType: CoverKeyType;
  value: string;
}

const GRISHAM_MULTI_KEYS: MultiKeyExample[] = [
  { title: 'The Chamber (John Grisham)', label: 'Internal Cover ID (id)', keyType: 'id', value: '240727' },
  { title: 'The Chamber (John Grisham)', label: 'Open Library ID (olid)', keyType: 'olid', value: 'OL7440033M' },
  { title: 'The Chamber (John Grisham)', label: 'ISBN-10 (isbn)', keyType: 'isbn', value: '0385472579' },
  { title: 'The Chamber (John Grisham)', label: 'ISBN-13 (isbn)', keyType: 'isbn', value: '9780385472579' },
  { title: 'The Chamber (John Grisham)', label: 'LCCN (lccn)', keyType: 'lccn', value: '93005405' },
  { title: 'The Chamber (John Grisham)', label: 'OCLC (oclc)', keyType: 'oclc', value: '28419896' },
];

const AUTHOR_PRESETS = [
  { name: 'Donald E. Knuth (Prompt Example)', keyType: 'olid' as AuthorKeyType, value: 'OL22521A', bio: 'Computer scientist, author of The Art of Computer Programming' },
  { name: 'J. R. R. Tolkien', keyType: 'olid' as AuthorKeyType, value: 'OL26320A', bio: 'Author of The Lord of the Rings and The Hobbit' },
  { name: 'Mark Twain', keyType: 'olid' as AuthorKeyType, value: 'OL18319A', bio: 'Samuel Langhorne Clemens, American humorist and novelist' },
  { name: 'Douglas Adams', keyType: 'olid' as AuthorKeyType, value: 'OL2622837A', bio: 'Author of The Hitchhiker’s Guide to the Galaxy' },
];

export const CoverApiExplorer: React.FC = () => {
  const [targetType, setTargetType] = useState<'book' | 'author'>('book');

  // Book parameters
  const [bookKeyType, setBookKeyType] = useState<CoverKeyType>('isbn');
  const [bookKeyValue, setBookKeyValue] = useState<string>('9780385533225');
  const [selectedSize, setSelectedSize] = useState<ImageSize>('M');
  const [defaultFalse, setDefaultFalse] = useState<boolean>(true);

  // Author parameters
  const [authorKeyType, setAuthorKeyType] = useState<AuthorKeyType>('olid');
  const [authorKeyValue, setAuthorKeyValue] = useState<string>('OL22521A');

  // Copy feedback state
  const [copiedType, setCopiedType] = useState<string | null>(null);

  // Image load tracking
  const [imgLoadError, setImgLoadError] = useState<boolean>(false);
  const [imgDimensions, setImgDimensions] = useState<{ width: number; height: number } | null>(null);

  const activeUrl = targetType === 'book'
    ? buildBookCoverUrl({ key: bookKeyType, value: bookKeyValue, size: selectedSize, defaultFalse })
    : buildAuthorPhotoUrl({ key: authorKeyType, value: authorKeyValue, size: selectedSize, defaultFalse });

  const courtesyLink = targetType === 'book'
    ? getOpenLibraryCourtesyLink(bookKeyType, bookKeyValue)
    : getOpenLibraryCourtesyLink('author', authorKeyValue);

  const htmlImgTag = `<img src="${activeUrl}" alt="${targetType === 'book' ? 'Book Cover' : 'Author Photo'}" />`;
  const courtesyHtmlTag = `<a href="${courtesyLink}" target="_blank" rel="noopener noreferrer">View on Open Library</a>`;
  const markdownTag = `[![${targetType === 'book' ? 'Book Cover' : 'Author Photo'}](${activeUrl})](${courtesyLink})`;

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleSelectMultiKey = (item: MultiKeyExample) => {
    setTargetType('book');
    setBookKeyType(item.keyType);
    setBookKeyValue(item.value);
    setImgLoadError(false);
  };

  const handleSelectAuthor = (author: typeof AUTHOR_PRESETS[0]) => {
    setTargetType('author');
    setAuthorKeyType(author.keyType);
    setAuthorKeyValue(author.value);
    setImgLoadError(false);
  };

  return (
    <div className="space-y-6">
      {/* Guidelines & Policy Banner */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-100 text-amber-900">
                <ImageIcon className="w-4 h-4" />
              </span>
              <h2 className="text-xl font-bold font-serif text-stone-900 tracking-tight">
                Open Library Covers & Author Photos API
              </h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-stone-100 text-stone-800 border border-stone-200">
                covers.openlibrary.org
              </span>
            </div>
            <p className="text-xs text-stone-600 max-w-3xl leading-relaxed">
              Official guidelines for embedding book covers and author photographs on public-facing pages without web scraping or crawling.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://openlibrary.org/dev/docs/api/covers"
              target="_blank"
              rel="noreferrer noopener"
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors flex items-center gap-1.5 border border-stone-200 cursor-pointer"
            >
              <span>Covers API Specs</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <a
              href="https://archive.org/details/olcovers"
              target="_blank"
              rel="noreferrer noopener"
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors flex items-center gap-1.5 border border-stone-200 cursor-pointer"
            >
              <span>Bulk Downloads (Archive.org)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* 3 Core Rules Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-950 space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              <span>Direct URL Embedding Only</span>
            </div>
            <p className="text-[11px] text-amber-900/80 leading-normal">
              Point your <code className="bg-amber-100/60 px-1 rounded">&lt;img src="..."&gt;</code> directly to <code className="bg-amber-100/60 px-1 rounded">covers.openlibrary.org</code>. Do not crawl or scrape the cover API.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-950 space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-700" />
              <span>Multi-Key Resolution</span>
            </div>
            <p className="text-[11px] text-blue-900/80 leading-normal">
              Reference any book via <strong>ISBN, OLID, Cover ID, LCCN</strong>, or <strong>OCLC</strong>, and author photos via <strong>OLID</strong> or <strong>ID</strong>.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-950 space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              <ExternalLink className="w-4 h-4 text-emerald-700" />
              <span>Courtesy Link Attribution</span>
            </div>
            <p className="text-[11px] text-emerald-900/80 leading-normal">
              Include a courtesy link back to Open Library on each individual book/author view or in your application footer.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Builder & Live Tester */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Controls & Configuration */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-5">
          {/* Target Entity Switcher: Book vs Author */}
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <span className="text-xs font-mono font-semibold text-stone-500 uppercase tracking-wider">
              Asset Type
            </span>
            <div className="flex items-center p-1 bg-stone-100 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setTargetType('book');
                  setImgLoadError(false);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  targetType === 'book' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                <span>Book Covers (/b/)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setTargetType('author');
                  setImgLoadError(false);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  targetType === 'author' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>Author Photos (/a/)</span>
              </button>
            </div>
          </div>

          {/* Key & Identifier Inputs */}
          {targetType === 'book' ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-mono font-medium text-stone-500 mb-1">
                    Key Type ($key)
                  </label>
                  <select
                    value={bookKeyType}
                    onChange={(e) => {
                      setBookKeyType(e.target.value as CoverKeyType);
                      setImgLoadError(false);
                    }}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-stone-50 border border-stone-200 text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 cursor-pointer"
                  >
                    <option value="isbn">ISBN (e.g. 0385472579)</option>
                    <option value="id">Cover ID (e.g. 240727)</option>
                    <option value="olid">OLID (e.g. OL7440033M)</option>
                    <option value="lccn">LCCN (e.g. 93005405)</option>
                    <option value="oclc">OCLC (e.g. 28419896)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono font-medium text-stone-500 mb-1">
                    Identifier Value ($value)
                  </label>
                  <input
                    type="text"
                    value={bookKeyValue}
                    onChange={(e) => {
                      setBookKeyValue(e.target.value);
                      setImgLoadError(false);
                    }}
                    placeholder="Enter ISBN, OLID, Cover ID, LCCN or OCLC"
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Multi-Key Resolution Presets (The Chamber - prompt example) */}
              <div className="pt-2">
                <div className="text-[11px] font-mono text-stone-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  <span>Prompt Example: 1 Book across 6 Different Keys</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {GRISHAM_MULTI_KEYS.map((item) => (
                    <button
                      key={item.keyType + item.value}
                      type="button"
                      onClick={() => handleSelectMultiKey(item)}
                      className={`p-2 rounded-lg text-left text-[11px] font-mono transition-colors border cursor-pointer ${
                        bookKeyType === item.keyType && bookKeyValue === item.value
                          ? 'bg-amber-50 border-amber-300 text-amber-900 font-semibold'
                          : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                      }`}
                    >
                      <div className="text-[10px] text-stone-400 uppercase">{item.keyType}</div>
                      <div className="truncate font-bold">{item.value}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-mono font-medium text-stone-500 mb-1">
                    Key Type ($key)
                  </label>
                  <select
                    value={authorKeyType}
                    onChange={(e) => {
                      setAuthorKeyType(e.target.value as AuthorKeyType);
                      setImgLoadError(false);
                    }}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-stone-50 border border-stone-200 text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 cursor-pointer"
                  >
                    <option value="olid">OLID (Open Library Author ID)</option>
                    <option value="id">Internal ID</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono font-medium text-stone-500 mb-1">
                    Author OLID ($value)
                  </label>
                  <input
                    type="text"
                    value={authorKeyValue}
                    onChange={(e) => {
                      setAuthorKeyValue(e.target.value);
                      setImgLoadError(false);
                    }}
                    placeholder="e.g. OL22521A (Donald E. Knuth)"
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Author Presets */}
              <div className="pt-2">
                <div className="text-[11px] font-mono text-stone-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-blue-600" />
                  <span>Author Photo Presets</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {AUTHOR_PRESETS.map((author) => (
                    <button
                      key={author.value}
                      type="button"
                      onClick={() => handleSelectAuthor(author)}
                      className={`p-2 rounded-lg text-left text-[11px] transition-colors border cursor-pointer ${
                        authorKeyValue === author.value
                          ? 'bg-blue-50 border-blue-300 text-blue-900 font-semibold'
                          : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                      }`}
                    >
                      <div className="font-bold font-serif">{author.name}</div>
                      <div className="text-[10px] font-mono text-stone-500">{author.value}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Size Selector & Default Parameter Toggle */}
          <div className="pt-3 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-medium text-stone-500 mb-1.5">
                Image Size ($size)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['S', 'M', 'L'] as ImageSize[]).map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setSelectedSize(sz)}
                    className={`py-1.5 px-3 rounded-xl text-xs font-mono font-semibold transition-all border cursor-pointer text-center ${
                      selectedSize === sz
                        ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <div>{sz}</div>
                    <div className="text-[9px] opacity-75 font-sans font-normal">
                      {sz === 'S' ? 'Small' : sz === 'M' ? 'Medium' : 'Large'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-stone-500 mb-1.5">
                Fallback Handling (<code className="text-amber-700">?default=false</code>)
              </label>
              <label className="flex items-start gap-2 p-2.5 rounded-xl bg-stone-50 border border-stone-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={defaultFalse}
                  onChange={(e) => setDefaultFalse(e.target.checked)}
                  className="rounded border-stone-300 text-amber-600 focus:ring-amber-500 mt-0.5 cursor-pointer"
                />
                <div className="text-xs text-stone-700">
                  <span className="font-semibold block font-mono text-[11px]">Append ?default=false</span>
                  <span className="text-[10px] text-stone-500 leading-tight block">
                    Returns HTTP 404 if missing (enabling clean HTML error fallbacks) instead of a 1x1 blank image.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Generated URL Inspector Bar */}
          <div className="pt-2">
            <div className="bg-stone-900 rounded-xl p-3 text-stone-200 space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] text-stone-400 uppercase tracking-wider">
                  Direct src URL
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(activeUrl, 'url')}
                  className="px-2 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {copiedType === 'url' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedType === 'url' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="truncate text-amber-400 select-all font-semibold">
                {activeUrl}
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Live Visual Preview & Dimensions */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100 text-xs">
              <span className="font-mono font-semibold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-amber-600" />
                <span>Live Browser Render</span>
              </span>

              {imgDimensions && !imgLoadError && (
                <span className="text-[11px] font-mono text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                  {imgDimensions.width} × {imgDimensions.height} px
                </span>
              )}
            </div>

            {/* Visual Canvas */}
            <div className="min-h-[280px] bg-stone-100/70 border border-dashed border-stone-300 rounded-xl p-6 flex flex-col items-center justify-center relative overflow-hidden">
              {!imgLoadError ? (
                <div className="relative group shadow-md rounded-lg overflow-hidden bg-white border border-stone-300 transition-transform">
                  <img
                    key={activeUrl}
                    src={activeUrl}
                    alt="Open Library Cover or Author Preview"
                    referrerPolicy="no-referrer"
                    onLoad={(e) => {
                      const target = e.target as HTMLImageElement;
                      setImgLoadError(false);
                      setImgDimensions({ width: target.naturalWidth, height: target.naturalHeight });
                    }}
                    onError={() => {
                      setImgLoadError(true);
                      setImgDimensions(null);
                    }}
                    className={`object-contain max-h-72 transition-all ${
                      selectedSize === 'S' ? 'max-w-[120px]' : selectedSize === 'M' ? 'max-w-[180px]' : 'max-w-[260px]'
                    }`}
                  />
                  <div className="absolute inset-0 bg-stone-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <a
                      href={activeUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="px-2.5 py-1 rounded bg-white text-stone-900 text-xs font-semibold shadow-xs flex items-center gap-1"
                    >
                      <Maximize2 className="w-3 h-3" />
                      <span>Open Full</span>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-center p-6 space-y-2 max-w-sm">
                  <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto" />
                  <div className="font-semibold text-xs text-stone-800">
                    No image returned (HTTP 404)
                  </div>
                  <p className="text-[11px] text-stone-500 leading-normal">
                    With <code className="font-mono text-amber-700">?default=false</code>, Open Library returns a 404 instead of a blank 1x1 image so your app can render custom fallbacks.
                  </p>
                </div>
              )}
            </div>

            {/* Courtesy Link Attribution Box */}
            <div className="bg-stone-50 rounded-xl p-3 border border-stone-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-stone-700 flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-amber-700" />
                  <span>Courtesy Link Requirement</span>
                </span>
                <a
                  href={courtesyLink}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-amber-800 hover:text-amber-950 hover:underline font-mono text-[11px] font-semibold flex items-center gap-1"
                >
                  <span>Visit Open Library</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
              <p className="text-[11px] text-stone-500 leading-relaxed">
                Guidelines state: <em>&quot;A courtesy link back to Open Library is appreciated, whether it be on each individual book&apos;s page... or on your About page or in your footer.&quot;</em>
              </p>
            </div>
          </div>

          {/* Exportable Snippets */}
          <div className="pt-2 space-y-2">
            <div className="text-[11px] font-mono font-semibold text-stone-500 uppercase tracking-wider">
              Integration Code Snippets
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleCopy(htmlImgTag, 'html')}
                className="p-2.5 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-left transition-colors cursor-pointer text-xs font-mono space-y-1"
              >
                <div className="flex items-center justify-between text-stone-500 text-[10px]">
                  <span>HTML &lt;img&gt; Tag</span>
                  {copiedType === 'html' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                </div>
                <div className="truncate text-stone-800 font-semibold">{htmlImgTag}</div>
              </button>

              <button
                type="button"
                onClick={() => handleCopy(courtesyHtmlTag, 'courtesy')}
                className="p-2.5 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-left transition-colors cursor-pointer text-xs font-mono space-y-1"
              >
                <div className="flex items-center justify-between text-stone-500 text-[10px]">
                  <span>Courtesy Link HTML</span>
                  {copiedType === 'courtesy' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                </div>
                <div className="truncate text-stone-800 font-semibold">{courtesyHtmlTag}</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
