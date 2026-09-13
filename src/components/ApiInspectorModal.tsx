import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Copy, Check, Code2, RefreshCw, Terminal, Globe } from 'lucide-react';
import { ShelfType } from '../types';

interface ApiInspectorModalProps {
  patron: string;
  initialShelf?: ShelfType;
  authCookie?: string;
  onClose: () => void;
}

export const ApiInspectorModal: React.FC<ApiInspectorModalProps> = ({
  patron,
  initialShelf = 'want-to-read',
  authCookie,
  onClose,
}) => {
  const [selectedShelf, setSelectedShelf] = useState<ShelfType>(initialShelf);
  const [limit, setLimit] = useState<number>(3);
  const [page, setPage] = useState<number>(1);
  const [jsonResult, setJsonResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);

  const openLibraryDirectUrl = `https://openlibrary.org/people/${encodeURIComponent(patron)}/books/${selectedShelf}.json?page=${page}&limit=${limit}`;
  const localApiUrl = `/api/reading-log/${encodeURIComponent(patron)}/${selectedShelf}?page=${page}&limit=${limit}`;

  const fetchLiveApi = async () => {
    setIsLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (authCookie) {
        headers['x-openlibrary-cookie'] = authCookie;
      }
      const res = await fetch(localApiUrl, { headers });
      const data = await res.json();
      setJsonResult(data);
    } catch (err: any) {
      setJsonResult({ error: err.message || 'Failed to fetch API' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveApi();
  }, [patron, selectedShelf, limit, page]);

  const curlCommand = `curl -s "${openLibraryDirectUrl}"${authCookie ? ` -H "Cookie: ${authCookie}"` : ''}`;

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(jsonResult, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(curlCommand);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        id="api-inspector-modal"
        className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-400/20 text-amber-300">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-wide font-mono uppercase">
                Open Library Reading Log API Inspector
              </h2>
              <p className="text-xs text-stone-400">
                Official REST endpoints for patron reading logs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Endpoint selector tabs */}
          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-2 font-mono">
              Target Reading Log Shelf Endpoint:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { id: 'want-to-read', label: 'Want to Read' },
                { id: 'currently-reading', label: 'Currently Reading' },
                { id: 'already-read', label: 'Already Read' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedShelf(s.id as ShelfType)}
                  className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                    selectedShelf === s.id
                      ? 'border-amber-600 bg-amber-50/70 text-amber-950 shadow-xs'
                      : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                  }`}
                >
                  <div className="text-xs font-bold">{s.label}</div>
                  <div className="text-[10px] font-mono text-stone-400 truncate">
                    books/{s.id}.json
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Endpoint URL display */}
          <div className="p-3 bg-stone-100 rounded-xl border border-stone-200 text-xs font-mono space-y-2">
            <div className="flex items-center justify-between text-stone-500 text-[11px]">
              <span className="flex items-center gap-1 font-semibold text-stone-700">
                <Globe className="w-3.5 h-3.5 text-amber-600" />
                Live Open Library REST URL:
              </span>
              <a
                href={openLibraryDirectUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="text-amber-800 hover:underline inline-flex items-center gap-1"
              >
                <span>Open in OpenLibrary.org</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-stone-200 text-stone-800 break-all select-all font-mono text-[11px]">
              {openLibraryDirectUrl}
            </div>

            {/* Query parameters adjuster */}
            <div className="flex items-center gap-4 pt-1 text-[11px] text-stone-600">
              <div className="flex items-center gap-1.5">
                <span>limit:</span>
                <select
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  className="px-2 py-0.5 bg-white border border-stone-300 rounded text-xs font-mono"
                >
                  <option value={1}>1</option>
                  <option value={3}>3</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                </select>
              </div>
              <div className="flex items-center gap-1.5">
                <span>page:</span>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={page}
                  onChange={(e) => setPage(Math.max(1, Number(e.target.value)))}
                  className="w-14 px-1.5 py-0.5 bg-white border border-stone-300 rounded text-xs font-mono"
                />
              </div>
              <button
                onClick={fetchLiveApi}
                disabled={isLoading}
                className="ml-auto flex items-center gap-1 text-xs text-stone-700 hover:text-stone-950 font-sans cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Re-query</span>
              </button>
            </div>
          </div>

          {/* cURL snippet */}
          <div className="bg-stone-900 text-stone-200 p-3 rounded-xl text-xs font-mono space-y-1.5 border border-stone-800">
            <div className="flex items-center justify-between text-stone-400 text-[11px]">
              <span className="flex items-center gap-1">
                <Terminal className="w-3 h-3 text-amber-400" />
                cURL Request:
              </span>
              <button
                onClick={handleCopyCurl}
                className="hover:text-white flex items-center gap-1 cursor-pointer"
              >
                {copiedCurl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCurl ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="overflow-x-auto text-[11px] text-amber-200">
              <code>{curlCommand}</code>
            </div>
          </div>

          {/* Live JSON Response */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-stone-500 font-mono">
              <span className="font-semibold text-stone-700">
                JSON Response ({jsonResult?.numFound !== undefined ? `${jsonResult.numFound} books total` : 'Payload'}):
              </span>
              <button
                onClick={handleCopyJson}
                className="flex items-center gap-1 text-stone-600 hover:text-stone-900 px-2 py-0.5 rounded bg-stone-100 hover:bg-stone-200 transition-colors font-mono text-[11px] cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy JSON'}</span>
              </button>
            </div>

            <div className="relative">
              {isLoading && (
                <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-2xs flex items-center justify-center rounded-xl z-10 text-white text-xs font-mono">
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  Fetching from Open Library...
                </div>
              )}
              <pre className="p-3.5 bg-stone-950 text-emerald-300 rounded-xl text-[11px] font-mono overflow-x-auto max-h-72 border border-stone-800 leading-relaxed">
                <code>{JSON.stringify(jsonResult, null, 2)}</code>
              </pre>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-stone-200 bg-stone-50 flex items-center justify-between">
          <span className="text-[11px] text-stone-500 font-mono">
            Patron: <strong className="text-stone-800">{patron}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-stone-900 text-white hover:bg-stone-800 transition-colors cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
