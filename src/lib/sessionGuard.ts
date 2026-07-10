/**
 * sessionGuard.ts
 *
 * Shared frontend utility for single-active-session enforcement.
 *
 * - Wraps fetch() to automatically attach the correct session header.
 * - Intercepts 401 responses that indicate a session conflict and fires
 *   a registered callback so the app can auto-logout and show a popup.
 *
 * Usage:
 *   import { userFetch, adminFetch, onSessionKicked } from '../lib/sessionGuard';
 *
 *   // In App.tsx root component:
 *   onSessionKicked('user', () => { ... logout + show popup });
 *   onSessionKicked('admin', () => { ... clear admin auth + show popup });
 *
 *   // Instead of fetch() for user-authenticated calls:
 *   const res = await userFetch('/api/bookings', { headers: { Authorization: `Bearer ${token}` } });
 *
 *   // Instead of fetch() for admin-authenticated calls:
 *   const res = await adminFetch('/api/admin/bookings', { headers: { 'X-Admin-Key': '...' } });
 */

export type SessionType = 'user' | 'admin';

// Session-kicked message sent by the server on mismatch
export const SESSION_KICKED_MESSAGE = 'Your account has been logged in on another device. Please log in again.';

// Global kick handlers — registered once by App.tsx
// Global kick handlers — registered once by App.tsx
const kickHandlers: Record<SessionType, (() => void)[]> = { user: [], admin: [] };

// In-memory cache of session IDs, preventing tabs from silently adopting new session IDs set by other tabs in localStorage
let userSessionIdInMemory = typeof window !== 'undefined' ? (localStorage.getItem('userSession') || '') : '';
let adminSessionIdInMemory = typeof window !== 'undefined' ? (localStorage.getItem('adminSession') || '') : '';

if (typeof window !== 'undefined') {
  const originalSetItem = localStorage.setItem;
  const originalRemoveItem = localStorage.removeItem;

  // Intercept local writes to localStorage so the in-memory cache updates instantly on the active tab
  localStorage.setItem = function (key: string, value: string) {
    if (key === 'adminSession') adminSessionIdInMemory = value;
    if (key === 'userSession') userSessionIdInMemory = value;
    originalSetItem.call(localStorage, key, value);
  };

  localStorage.removeItem = function (key: string) {
    if (key === 'adminSession') adminSessionIdInMemory = '';
    if (key === 'userSession') userSessionIdInMemory = '';
    originalRemoveItem.call(localStorage, key);
  };

  // Listen for storage events (which fire only on OTHER tabs/windows of the same origin when localStorage changes)
  window.addEventListener('storage', (event) => {
    if (event.key === 'adminSession' && event.newValue && event.newValue !== adminSessionIdInMemory) {
      fireKick('admin');
    }
    if (event.key === 'userSession' && event.newValue && event.newValue !== userSessionIdInMemory) {
      fireKick('user');
    }
  });
}

/**
 * Register a callback to be invoked when a session-conflict 401 is detected.
 * Returns an unsubscribe function.
 */
export function onSessionKicked(type: SessionType, handler: () => void): () => void {
  kickHandlers[type].push(handler);
  return () => {
    kickHandlers[type] = kickHandlers[type].filter(h => h !== handler);
  };
}

function fireKick(type: SessionType) {
  for (const handler of kickHandlers[type]) {
    try { handler(); } catch (e) { console.error('Session kick handler error:', e); }
  }
}

/**
 * Get the stored user session ID from localStorage.
 */
export function getUserSessionId(): string {
  return userSessionIdInMemory;
}

/**
 * Get the stored admin session ID from localStorage.
 */
export function getAdminSessionId(): string {
  return adminSessionIdInMemory;
}

/**
 * Check if a 401 response represents a session-conflict kick.
 */
async function isSessionConflict(response: Response): Promise<boolean> {
  if (response.status !== 401) return false;
  try {
    const clone = response.clone();
    const data = await clone.json();
    return (
      typeof data?.error === 'string' &&
      data.error.includes('another device')
    );
  } catch {
    return false;
  }
}

/**
 * fetch() wrapper for user-authenticated API calls.
 * Automatically injects X-User-Session header.
 * On session-conflict 401, fires the registered 'user' kick handlers.
 */
export async function userFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const sessionId = getUserSessionId();
  const headers = new Headers(init?.headers);
  if (sessionId) {
    headers.set('X-User-Session', sessionId);
  }

  const response = await fetch(input, { ...init, headers });

  if (await isSessionConflict(response)) {
    fireKick('user');
  }

  return response;
}

/**
 * fetch() wrapper for admin-authenticated API calls.
 * Automatically injects X-Admin-Session header.
 * On session-conflict 401, fires the registered 'admin' kick handlers.
 */
export async function adminFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const sessionId = getAdminSessionId();
  const headers = new Headers(init?.headers);
  if (sessionId) {
    headers.set('X-Admin-Session', sessionId);
  }

  const response = await fetch(input, { ...init, headers });

  if (await isSessionConflict(response)) {
    fireKick('admin');
  }

  return response;
}
