export const LIVE_BACKEND_URL =
  'https://ais-pre-mtg3tdgb56wt2oh7u3czon-48622829419.asia-southeast1.run.app';

export const BACKEND_URL =
  typeof window !== 'undefined'
    ? ((import.meta.env as any).VITE_BACKEND_URL || '').trim().replace(/\/$/, '')
    : '';

/**
 * Resolves the API endpoint URL.
 * Automatically points to the live backend server on Cloud Run when running
 * on static hosts (like Firebase Hosting *.web.app, *.firebaseapp.com) or localhost.
 */
export const getApiUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isFirebaseHosting =
      hostname.endsWith('web.app') ||
      hostname.endsWith('firebaseapp.com') ||
      hostname.includes('firebase');

    if (isFirebaseHosting) {
      const base = BACKEND_URL || LIVE_BACKEND_URL;
      return `${base}${cleanEndpoint}`;
    }

    if (BACKEND_URL) {
      return `${BACKEND_URL}${cleanEndpoint}`;
    }
  }

  return cleanEndpoint;
};

/**
 * Enhanced fetch wrapper with timeout (30s), automatic 1-retry on network blips,
 * and automatic fallback to the live full-stack backend if a static host returns HTML.
 */
export const fetchApi = async (
  endpoint: string,
  options: RequestInit = {},
  retries = 1,
  timeoutMs = 30000
): Promise<Response> => {
  const primaryUrl = getApiUrl(endpoint);
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const fallbackUrl = `${LIVE_BACKEND_URL}${cleanEndpoint}`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(primaryUrl, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timer);

      // If a static web server intercepted the route and returned index.html,
      // transparently retry against the live Cloud Run backend URL!
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/html') && primaryUrl !== fallbackUrl) {
        console.warn(`[Vikranth AI] Endpoint ${primaryUrl} returned HTML; falling back to live backend: ${fallbackUrl}`);
        const fallbackRes = await fetch(fallbackUrl, {
          ...options,
        });
        return fallbackRes;
      }

      return response;
    } catch (err: any) {
      clearTimeout(timer);
      const isAbort = err.name === 'AbortError';
      const isNetwork =
        err.message?.includes('Failed to fetch') ||
        err.message?.includes('NetworkError') ||
        err.message?.includes('fetch failed');

      if (attempt < retries && (isNetwork || isAbort)) {
        await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
        continue;
      }

      // If primary fetch failed, try direct live backend
      if (primaryUrl !== fallbackUrl) {
        try {
          const fallbackRes = await fetch(fallbackUrl, { ...options });
          return fallbackRes;
        } catch {
          // fall through
        }
      }

      if (isAbort) {
        throw new Error('Request timed out while contacting AI server. Please try again.');
      }
      throw err;
    }
  }

  throw new Error('Unable to connect to AI server. Please check your network connection.');
};

/**
 * Clean, user-friendly error formatting.
 */
export const formatApiError = (err: any): string => {
  if (!err) return 'An unexpected error occurred.';
  const msg = err.message || String(err);
  if (
    msg.includes('Failed to fetch') ||
    msg.includes('unable to fetch') ||
    msg.includes('NetworkError') ||
    msg.includes('fetch failed') ||
    msg.includes('HTML document')
  ) {
    return 'Unable to reach the AI engine right now. Please verify your internet connection or click retry.';
  }
  return msg;
};

/**
 * Robust JSON parser that NEVER throws HTML errors to the user.
 */
export const safeParseJsonResponse = async (res: Response): Promise<{ data: any; isHtml: boolean; rawText: string }> => {
  const contentType = res.headers.get('content-type') || '';
  const text = await res.text();

  if (contentType.includes('application/json')) {
    try {
      return { data: JSON.parse(text), isHtml: false, rawText: text };
    } catch {
      // Fall through to text handling
    }
  }

  const isHtml =
    text.trim().startsWith('<!doctype') ||
    text.trim().startsWith('<!DOCTYPE') ||
    text.trim().startsWith('<html') ||
    text.includes('<html');

  if (isHtml) {
    return {
      data: { error: 'The AI engine is temporarily reconnecting. Please send your message again.' },
      isHtml: true,
      rawText: text,
    };
  }

  try {
    return { data: JSON.parse(text), isHtml: false, rawText: text };
  } catch {
    return { data: { error: text || 'Non-JSON response received.' }, isHtml: false, rawText: text };
  }
};
