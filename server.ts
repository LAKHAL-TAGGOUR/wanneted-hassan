import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory cache to prevent rate-limiting Open Library and speed up navigation
interface CacheEntry {
  data: any;
  timestamp: number;
}
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

// Helper function with retry for fetching Open Library
async function fetchWithRetry(url: string, headers: Record<string, string>, retries = 2): Promise<Response> {
  let lastError: any = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);
      const res = await fetch(url, {
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (res.status === 502 || res.status === 503 || res.status === 504) {
        if (attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
          continue;
        }
      }
      return res;
    } catch (err: any) {
      lastError = err;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 600 * (attempt + 1)));
      }
    }
  }
  throw lastError || new Error('Network request failed');
}

// API: Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API: Summary of all 3 shelves (counts and top book) for a patron
app.get('/api/reading-log-summary/:username', async (req, res) => {
  const { username } = req.params;
  const authCookie = req.headers['x-openlibrary-cookie'] as string | undefined;

  const shelves = ['want-to-read', 'currently-reading', 'already-read'] as const;
  const cacheKey = `summary:${username.toLowerCase()}:${authCookie ? 'auth' : 'pub'}`;

  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return res.json(cached.data);
  }

  const reqHeaders: Record<string, string> = {
    'User-Agent': 'OpenLibraryReadingLogViewer/1.0 (PatronLogExplorer; +https://openlibrary.org)',
    'Accept': 'application/json',
  };
  if (authCookie) {
    reqHeaders['Cookie'] = authCookie;
  }

  try {
    const results = await Promise.allSettled(
      shelves.map(async (shelf) => {
        const targetUrl = `https://openlibrary.org/people/${encodeURIComponent(username)}/books/${shelf}.json?limit=1`;
        const response = await fetchWithRetry(targetUrl, reqHeaders);
        if (!response.ok) {
          return {
            shelf,
            status: response.status,
            numFound: 0,
            hasAccess: response.status !== 401 && response.status !== 403 && response.status !== 404,
            error: response.status === 404 ? 'Not found' : response.statusText,
          };
        }
        const data = await response.json();
        return {
          shelf,
          status: 200,
          numFound: typeof data.numFound === 'number' ? data.numFound : (data.reading_log_entries?.length || 0),
          hasAccess: true,
          latestBook: data.reading_log_entries?.[0] || null,
        };
      })
    );

    const summary: Record<string, any> = {
      username,
      shelves: {},
      totalBooks: 0,
      isAccessible: false,
    };

    results.forEach((r, idx) => {
      const shelfName = shelves[idx];
      if (r.status === 'fulfilled') {
        summary.shelves[shelfName] = r.value;
        if (r.value.hasAccess) {
          summary.isAccessible = true;
          summary.totalBooks += r.value.numFound;
        }
      } else {
        summary.shelves[shelfName] = {
          shelf: shelfName,
          status: 500,
          numFound: 0,
          hasAccess: false,
          error: r.reason?.message || 'Failed to fetch',
        };
      }
    });

    cache.set(cacheKey, { data: summary, timestamp: Date.now() });
    res.json(summary);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch summary' });
  }
});

// API: Detailed shelf reading log
app.get('/api/reading-log/:username/:shelf', async (req, res) => {
  const { username, shelf } = req.params;
  const page = parseInt((req.query.page as string) || '1', 10);
  const limit = Math.min(parseInt((req.query.limit as string) || '20', 10), 100);
  const authCookie = req.headers['x-openlibrary-cookie'] as string | undefined;

  const validShelves = ['want-to-read', 'currently-reading', 'already-read'];
  if (!validShelves.includes(shelf)) {
    return res.status(400).json({
      error: `Invalid shelf "${shelf}". Must be one of: ${validShelves.join(', ')}`,
    });
  }

  const cacheKey = `shelf:${username.toLowerCase()}:${shelf}:${page}:${limit}:${authCookie ? 'auth' : 'pub'}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return res.json(cached.data);
  }

  const targetUrl = `https://openlibrary.org/people/${encodeURIComponent(username)}/books/${shelf}.json?page=${page}&limit=${limit}`;

  const reqHeaders: Record<string, string> = {
    'User-Agent': 'OpenLibraryReadingLogViewer/1.0 (PatronLogExplorer; +https://openlibrary.org)',
    'Accept': 'application/json',
  };
  if (authCookie) {
    reqHeaders['Cookie'] = authCookie;
  }

  try {
    const response = await fetchWithRetry(targetUrl, reqHeaders);

    if (response.status === 404) {
      return res.status(404).json({
        error: `No reading log found for patron "${username}" on shelf "${shelf}". The account may not exist or its reading log is private.`,
        status: 404,
        patron: username,
        shelf,
        openLibraryUrl: targetUrl,
      });
    }

    if (response.status === 401 || response.status === 403) {
      return res.status(response.status).json({
        error: `Access denied. Patron "${username}" reading log is private. Please authenticate with Open Library session credentials.`,
        status: response.status,
        patron: username,
        shelf,
        openLibraryUrl: targetUrl,
      });
    }

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Open Library returned status ${response.status}: ${response.statusText}`,
        status: response.status,
        openLibraryUrl: targetUrl,
      });
    }

    const data = await response.json();
    const payload = {
      patron: username,
      shelf,
      openLibraryUrl: targetUrl,
      page: data.page ?? page,
      limit,
      numFound: typeof data.numFound === 'number' ? data.numFound : (data.reading_log_entries?.length || 0),
      reading_log_entries: data.reading_log_entries || [],
      fetchedAt: new Date().toISOString(),
    };

    cache.set(cacheKey, { data: payload, timestamp: Date.now() });
    res.json(payload);
  } catch (error: any) {
    res.status(500).json({
      error: error.message || 'Failed to fetch reading log from Open Library',
      targetUrl,
    });
  }
});

// API: Open Library Search Proxy (search.json & search/authors.json)
app.get('/api/openlibrary-search', async (req, res) => {
  try {
    const { endpoint, ...params } = req.query;
    const isAuthors = endpoint === 'authors';
    const basePath = isAuthors ? '/search/authors.json' : '/search.json';

    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    }

    const targetUrl = `https://openlibrary.org${basePath}?${searchParams.toString()}`;
    const cacheKey = `search:${targetUrl}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return res.json({ ...cached.data, cached: true });
    }

    const startTime = Date.now();
    const upstreamRes = await fetchWithRetry(
      targetUrl,
      {
        'User-Agent': 'OpenLibraryReadingLogViewer/1.0 (SearchAPIExplorer; +https://openlibrary.org)',
        'Accept': 'application/json',
      },
      2
    );

    if (!upstreamRes.ok) {
      const errText = await upstreamRes.text().catch(() => '');
      return res.status(upstreamRes.status).json({
        error: `Open Library Search returned status ${upstreamRes.status}`,
        details: errText.slice(0, 300),
        targetUrl,
      });
    }

    const data = await upstreamRes.json();
    const durationMs = Date.now() - startTime;
    const responsePayload = {
      ...data,
      targetUrl,
      durationMs,
      numFound: data.numFound ?? data.num_found ?? 0,
      start: data.start ?? 0,
      docs: data.docs || [],
      fetchedAt: new Date().toISOString(),
    };

    cache.set(cacheKey, { data: responsePayload, timestamp: Date.now() });
    res.json(responsePayload);
  } catch (err: any) {
    console.error('Search proxy error:', err);
    res.status(500).json({ error: err.message || 'Failed to proxy Open Library search request' });
  }
});

// API: Archive.org Metadata & Datanode Locator
app.get('/api/archive/metadata/:identifier', async (req, res) => {
  const { identifier } = req.params;
  try {
    const metaRes = await fetchWithRetry(
      `https://archive.org/metadata/${encodeURIComponent(identifier)}`,
      { 'User-Agent': 'OpenLibraryReadingLogViewer/1.0' }
    );
    if (!metaRes.ok) {
      return res.status(metaRes.status).json({
        error: `Archive.org metadata query failed with status ${metaRes.status}`,
        identifier,
      });
    }
    const data = await metaRes.json();
    res.json({
      identifier,
      d1: data.d1 || null,
      d2: data.d2 || null,
      dir: data.dir || null,
      title: data.metadata?.title || null,
      creator: data.metadata?.creator || null,
      year: data.metadata?.year || data.metadata?.date || null,
      mediatype: data.metadata?.mediatype || null,
      files_count: data.files?.length || 0,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch metadata from Archive.org' });
  }
});

// API: Search Inside Book using fulltext/inside.php API
app.get('/api/archive/search-inside', async (req, res) => {
  let item_id = (req.query.item_id as string)?.trim();
  const q = (req.query.q as string)?.trim();
  let hostname = (req.query.hostname as string)?.trim();
  let itemPath = (req.query.path as string)?.trim();
  let doc = (req.query.doc as string)?.trim();
  const callback = (req.query.callback as string)?.trim();

  if (!item_id || !q) {
    return res.status(400).json({
      error: 'Both "item_id" and "q" query parameters are required.',
    });
  }

  try {
    // If item_id is an Open Library edition key (e.g. OL40215276M), resolve ocaid first
    let resolvedItem = item_id;
    if (/^OL\d+M$/i.test(item_id)) {
      try {
        const olRes = await fetchWithRetry(
          `https://openlibrary.org/books/${encodeURIComponent(item_id)}.json`,
          { 'User-Agent': 'OpenLibraryReadingLogViewer/1.0' }
        );
        if (olRes.ok) {
          const olData = await olRes.json();
          if (olData.ocaid) {
            resolvedItem = olData.ocaid;
          } else if (Array.isArray(olData.ia) && olData.ia[0]) {
            resolvedItem = olData.ia[0];
          }
        }
      } catch {
        // continue with original item_id
      }
    }

    if (!doc) {
      doc = resolvedItem;
    }

    // If hostname or path missing, dynamically query archive.org/metadata/{identifier}
    let metadata: any = null;
    if (!hostname || !itemPath) {
      const metaRes = await fetchWithRetry(
        `https://archive.org/metadata/${encodeURIComponent(resolvedItem)}`,
        { 'User-Agent': 'OpenLibraryReadingLogViewer/1.0' }
      );
      if (metaRes.ok) {
        metadata = await metaRes.json();
        if (!hostname) {
          hostname = metadata.d1 || metadata.d2 || 'ia800204.us.archive.org';
        }
        if (!itemPath) {
          itemPath = metadata.dir || `/items/${resolvedItem}`;
        }
      } else {
        if (!hostname) hostname = 'ia800204.us.archive.org';
        if (!itemPath) itemPath = `/items/${resolvedItem}`;
      }
    }

    // Construct the inside.php API URL
    const targetUrl = `https://${hostname}/fulltext/inside.php?item_id=${encodeURIComponent(resolvedItem)}&doc=${encodeURIComponent(doc)}&path=${encodeURIComponent(itemPath)}&q=${encodeURIComponent(q)}`;

    const insideRes = await fetchWithRetry(
      targetUrl,
      {
        'User-Agent': 'OpenLibraryReadingLogViewer/1.0 (InsideBookSearch; +https://archive.org)',
        'Accept': 'application/json, text/javascript, */*',
      },
      2
    );

    if (!insideRes.ok) {
      // If d1 failed and d2 exists, try d2
      if (metadata?.d2 && hostname !== metadata.d2) {
        const fallbackHost = metadata.d2;
        const fallbackUrl = `https://${fallbackHost}/fulltext/inside.php?item_id=${encodeURIComponent(resolvedItem)}&doc=${encodeURIComponent(doc)}&path=${encodeURIComponent(itemPath)}&q=${encodeURIComponent(q)}`;
        const fbRes = await fetchWithRetry(fallbackUrl, {
          'User-Agent': 'OpenLibraryReadingLogViewer/1.0',
        });
        if (fbRes.ok) {
          const rawText = await fbRes.text();
          return sendInsideResponse(rawText, fallbackUrl, fallbackHost, itemPath, resolvedItem, doc, q, callback, metadata, res);
        }
      }
      return res.status(insideRes.status).json({
        error: `Search inside API returned HTTP ${insideRes.status}: ${insideRes.statusText}`,
        targetUrl,
        resolvedItem,
      });
    }

    const rawText = await insideRes.text();
    return sendInsideResponse(rawText, targetUrl, hostname, itemPath, resolvedItem, doc, q, callback, metadata, res);
  } catch (err: any) {
    res.status(500).json({
      error: err.message || 'Error executing search inside book',
      item_id,
      q,
    });
  }
});

function sendInsideResponse(
  rawText: string,
  targetUrl: string,
  hostname: string,
  path: string,
  item_id: string,
  doc: string,
  q: string,
  callback: string | undefined,
  metadata: any,
  res: express.Response
) {
  let parsed: any = null;
  // Handle JSONP wrapper if returned with reply(...)
  const trimmed = rawText.trim();
  const jsonpMatch = trimmed.match(/^[\w$]+\s*\(\s*([\s\S]*)\s*\);?$/);
  if (jsonpMatch && jsonpMatch[1]) {
    try {
      parsed = JSON.parse(jsonpMatch[1]);
    } catch {
      // ignore
    }
  }

  if (!parsed) {
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      return res.status(500).json({
        error: 'Unable to parse response from inside.php',
        rawText: trimmed.slice(0, 500),
        targetUrl,
      });
    }
  }

  const jsonpPreview = callback
    ? `${callback}( ${JSON.stringify(parsed, null, 2)} )`
    : `reply( ${JSON.stringify(parsed, null, 2)} )`;

  const payload = {
    ia: parsed.ia || item_id,
    item_id,
    doc,
    hostname,
    path,
    q: parsed.q || q,
    page_count: parsed.page_count,
    body_length: parsed.body_length,
    leaf0_missing: parsed.leaf0_missing,
    matches_count: parsed.matches?.length || 0,
    matches: parsed.matches || [],
    metadata: metadata
      ? {
          title: metadata.metadata?.title,
          creator: metadata.metadata?.creator,
          year: metadata.metadata?.year || metadata.metadata?.date,
          d1: metadata.d1,
          d2: metadata.d2,
          dir: metadata.dir,
          mediatype: metadata.metadata?.mediatype,
        }
      : undefined,
    raw_url: targetUrl,
    callback: callback || undefined,
    jsonp_preview: jsonpPreview,
    fetchedAt: new Date().toISOString(),
  };

  res.json(payload);
}

// Vite middleware & Static Serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
