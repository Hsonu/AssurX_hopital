/**
 * apiClient.ts
 *
 * Robust, safe API request and retry engine designed to handle
 * temporary network disconnects, server reconnections, and intermittent drops.
 *
 * SAFETY RULES:
 * 1. GET / HEAD requests are automatically retried with exponential backoff.
 * 2. POST / PUT / PATCH / DELETE (especially payments, orders, bookings)
 *    are NEVER automatically retried unless explicitly marked as idempotent.
 * 3. Uses AbortController to prevent hanging requests.
 * 4. Listens for window 'online' / 'offline' events to trigger automatic recovery.
 */

export interface SafeFetchOptions extends RequestInit {
  timeoutMs?: number;
  retries?: number;
  initialDelayMs?: number;
  idempotent?: boolean;
}

const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_INITIAL_DELAY_MS = 1000;

// Set of listeners notified on connectivity transitions
type NetworkListener = (isOnline: boolean) => void;
const networkListeners: Set<NetworkListener> = new Set();
let registeredWindowListeners = false;

function setupNetworkListeners() {
  if (typeof window === 'undefined' || registeredWindowListeners) return;
  registeredWindowListeners = true;

  window.addEventListener('online', () => {
    console.log('[Network] Internet connection restored. Recovering data...');
    networkListeners.forEach((listener) => {
      try { listener(true); } catch (e) { console.error('Network listener error:', e); }
    });
  });

  window.addEventListener('offline', () => {
    console.warn('[Network] Internet connection lost.');
    networkListeners.forEach((listener) => {
      try { listener(false); } catch (e) { console.error('Network listener error:', e); }
    });
  });
}

/**
 * Register a listener for online/offline changes.
 * Returns an unsubscribe callback.
 */
export function subscribeNetworkStatus(listener: NetworkListener): () => void {
  setupNetworkListeners();
  networkListeners.add(listener);
  return () => {
    networkListeners.delete(listener);
  };
}

/**
 * Check if the browser currently has internet connectivity.
 */
export function isNetworkOnline(): boolean {
  if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
    return navigator.onLine;
  }
  return true;
}

/**
 * Helper to determine if an HTTP method is inherently safe to retry.
 */
function isSafeMethod(method: string = 'GET'): boolean {
  const upper = method.toUpperCase();
  return upper === 'GET' || upper === 'HEAD' || upper === 'OPTIONS';
}

/**
 * Determines whether a given error or response warrants a retry.
 */
function shouldRetry(error: any, response?: Response): boolean {
  if (response) {
    // Retry on gateway errors, bad gateway, service unavailable, gateway timeout
    return [502, 503, 504].includes(response.status);
  }
  if (!error) return false;
  // Network errors, aborted timeouts, connection resets
  const msg = String(error.message || error).toLowerCase();
  return (
    error.name === 'AbortError' ||
    error.name === 'TypeError' ||
    msg.includes('failed to fetch') ||
    msg.includes('network') ||
    msg.includes('timeout') ||
    msg.includes('connection closed') ||
    msg.includes('connection reset') ||
    !isNetworkOnline()
  );
}

/**
 * Main safeFetch function.
 */
export async function safeFetch(
  input: RequestInfo | URL,
  options: SafeFetchOptions = {}
): Promise<Response> {
  setupNetworkListeners();

  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retries = DEFAULT_MAX_RETRIES,
    initialDelayMs = DEFAULT_INITIAL_DELAY_MS,
    idempotent = false,
    ...fetchInit
  } = options;

  const method = (fetchInit.method || 'GET').toUpperCase();
  const canRetry = isSafeMethod(method) || idempotent;
  const maxAttempts = canRetry ? 1 + Math.max(0, retries) : 1;

  let lastError: any = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    // Merge external abort signals if provided
    let combinedSignal = controller.signal;
    if (fetchInit.signal) {
      if (fetchInit.signal.aborted) {
        clearTimeout(timeoutId);
        throw new DOMException('Aborted', 'AbortError');
      }
      fetchInit.signal.addEventListener('abort', () => controller.abort());
    }

    try {
      const response = await fetch(input, {
        ...fetchInit,
        signal: combinedSignal,
      });

      clearTimeout(timeoutId);

      // Check if server returned transient 502/503/504 and we are allowed to retry
      if (!response.ok && shouldRetry(null, response) && attempt < maxAttempts) {
        const delay = initialDelayMs * Math.pow(2, attempt - 1);
        console.warn(`[safeFetch] Server returned ${response.status} on attempt ${attempt}/${maxAttempts} for ${input.toString()}. Retrying in ${delay}ms...`);
        await new Promise((res) => setTimeout(res, delay));
        continue;
      }

      return response;
    } catch (err: any) {
      clearTimeout(timeoutId);
      lastError = err;

      if (attempt < maxAttempts && shouldRetry(err)) {
        const delay = initialDelayMs * Math.pow(2, attempt - 1);
        console.warn(`[safeFetch] Request failed on attempt ${attempt}/${maxAttempts} (${err.message || 'Network error'}). Retrying in ${delay}ms...`);
        await new Promise((res) => setTimeout(res, delay));
        continue;
      }

      // If cannot retry (or exhausted retries), rethrow
      throw err;
    }
  }

  throw lastError || new Error(`Request failed after ${maxAttempts} attempts`);
}
