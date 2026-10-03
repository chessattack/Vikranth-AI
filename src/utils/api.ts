export const BACKEND_URL =
  typeof window !== 'undefined'
    ? ((import.meta.env as any).VITE_BACKEND_URL || '').trim().replace(/\/$/, '')
    : '';

/**
 * Resolves the API endpoint URL.
 * In full-stack mode, relative endpoints like /api/chat connect directly
 * to the running server on the same origin.
 */
export const getApiUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  if (BACKEND_URL) {
    return `${BACKEND_URL}${cleanEndpoint}`;
  }

  return cleanEndpoint;
};

/**
 * Enhanced fetch wrapper with timeout (30s) and automatic 1-retry on network blips.
 */
export const fetchApi = async (
  endpoint: string,
  options: RequestInit = {},
  retries = 1,
  timeoutMs = 45000
): Promise<Response> => {
  const url = getApiUrl(endpoint);

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timer);
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
    msg.includes('fetch failed')
  ) {
    return 'Unable to reach the AI engine right now. Please verify your internet connection and try again.';
  }
  return msg;
};

/**
 * Robust JSON parser that handles responses cleanly.
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
      data: { error: 'The server returned an unexpected response. Please try your message again.' },
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
