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
  return localStorage.getItem('assurx_patient_session_id');
}

/** Store user session ID in localStorage. */
function saveSessionId(id: string) {
  localStorage.setItem('assurx_patient_session_id', id);
}

/** Create a unique session ID. */
function createSessionId(): string {
  const id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  saveSessionId(id);
  return id;
}

/** Clear the persisted user session. */
function clearSessionId(): void {
  localStorage.removeItem('assurx_patient_session_id');
}

/** Register current session ID on Express backend. */
async function registerSessionOnServer(jwtToken: string, sessionId: string) {
  try {
    await fetch('/api/users/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`,
      },
      body: JSON.stringify({ sessionId }),
    });
  } catch (error) {
    console.error('Failed to register session on server:', error);
  }
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    idToken: null,
    sessionId: null,
    loading: true,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken();
          const existingSession = loadSessionId();
          const sessionId = existingSession || createSessionId();

          // Sync and sign in with custom backend to get custom JWT
          const syncRes = await fetch('/api/auth/google', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ idToken: token }),
          });

          if (!syncRes.ok) {
            throw new Error('Backend authentication sync failed');
          }

          const { jwtToken } = await syncRes.json();
          localStorage.setItem('assurx_patient_jwt', jwtToken);

          // Register session
          await registerSessionOnServer(jwtToken, sessionId);

          setState({ user, idToken: jwtToken, sessionId, loading: false });
        } catch (error: any) {
          console.error('Failed to sync user on auth state change:', error);
          const fallbackToken = localStorage.getItem('assurx_patient_jwt');
          setState({ user, idToken: fallbackToken, sessionId: loadSessionId(), loading: false });
        }
      } else {
        localStorage.removeItem('assurx_patient_jwt');
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

      // Sync and sign in with custom backend to get custom JWT
      const syncRes = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken: token }),
      });

      if (!syncRes.ok) {
        throw new Error('Backend authentication failed');
      }

      const { jwtToken } = await syncRes.json();
      localStorage.setItem('assurx_patient_jwt', jwtToken);

      // Create a fresh session ID — this invalidates any other device
      const sessionId = createSessionId();

      // Register on server (replaces any previous session in DB)
      await registerSessionOnServer(jwtToken, sessionId);

      setState(prev => ({ ...prev, idToken: jwtToken, sessionId, user: result.user }));
      return result.user;
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
        alert('Google Sign-In Error: ' + (error.message || error));
      }
      throw error;
    }
  };

  // ── logout ──────────────────────────────────────────────────────────────────
  const logout = async () => {
    try {
      // Invalidate session on server
      const token = state.idToken || localStorage.getItem('assurx_patient_jwt');
      const sessionId = loadSessionId();
      if (token && sessionId) {
        try {
          await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          });
        } catch (_) { /* fire and forget */ }
      }
    } finally {
      clearSessionId();
      localStorage.removeItem('assurx_demo_user');
      localStorage.removeItem('assurx_patient_jwt');
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
