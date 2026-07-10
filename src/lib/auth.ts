import { useState, useEffect } from 'react';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User,
} from 'firebase/auth';
import { auth, googleAuthProvider } from './firebase.ts';

export interface AuthState {
  user: User | null;
  idToken: string | null;
  sessionId: string | null;
  loading: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Read user session ID from localStorage (injected into all user API calls). */
function loadSessionId(): string | null {
  return localStorage.getItem('userSession');
}

/** Generate and persist a fresh session ID. */
function createSessionId(): string {
  const id = crypto.randomUUID();
  localStorage.setItem('userSession', id);
  return id;
}

/** Clear the persisted user session. */
function clearSessionId(): void {
  localStorage.removeItem('userSession');
}

/**
 * Register the session with the server so it becomes the ONLY valid session
 * for this account. Any other device using a different sessionId will be
 * kicked on their next API call.
 */
async function registerSessionOnServer(token: string, sessionId: string): Promise<void> {
  try {
    await fetch('/api/users/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-User-Session': sessionId,
      },
      body: JSON.stringify({ sessionId }),
    });
  } catch (err) {
    console.warn('Could not register session on server:', err);
  }
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    idToken: null,
    sessionId: loadSessionId(),
    loading: true,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken();
          const existingSession = loadSessionId();
          const sessionId = existingSession || createSessionId();

          // Sync DB user row
          await fetch('/api/users/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'X-User-Session': sessionId,
            }
          });

          setState({ user, idToken: token, sessionId, loading: false });
        } catch (error) {
          console.error('Failed to sync user on auth state change:', error);
          setState({ user, idToken: null, sessionId: loadSessionId(), loading: false });
        }
      } else {
        setState({ user: null, idToken: null, sessionId: null, loading: false });
      }
    });

    return () => unsubscribe();
  }, []);

  // ── loginWithGoogle ─────────────────────────────────────────────────────────
  const loginWithGoogle = async () => {
    try {
      localStorage.removeItem('assurx_demo_user');
      const result = await signInWithPopup(auth, googleAuthProvider);
      const token = await result.user.getIdToken();

      // Create a fresh session ID — this invalidates any other device
      const sessionId = createSessionId();

      // Register on server (replaces any previous session in DB)
      await registerSessionOnServer(token, sessionId);

      // Sync user row with new session header
      await fetch('/api/users/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-User-Session': sessionId,
        }
      });

      setState(prev => ({ ...prev, idToken: token, sessionId, user: result.user }));
      return result.user;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  // ── logout ──────────────────────────────────────────────────────────────────
  const logout = async () => {
    try {
      // Invalidate session on server
      const token = state.idToken;
      const sessionId = loadSessionId();
      if (token && sessionId) {
        try {
          await fetch('/api/users/session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'X-User-Session': sessionId,
            },
            body: JSON.stringify({ sessionId: '' }),
          });
        } catch (_) { /* fire and forget */ }
      }
    } finally {
      clearSessionId();
      localStorage.removeItem('assurx_demo_user');
      setState({ user: null, idToken: null, sessionId: null, loading: false });
      await signOut(auth).catch(() => {});
    }
  };

  return {
    ...state,
    loginWithGoogle,
    logout,
  };
}
