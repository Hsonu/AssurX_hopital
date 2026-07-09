import { useState, useEffect } from 'react';
import { 
  getAuth, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User,
  GoogleAuthProvider
} from 'firebase/auth';
import { auth, googleAuthProvider } from './firebase.ts';

export interface AuthState {
  user: User | null;
  idToken: string | null;
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    idToken: null,
    loading: true,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken();
          // Sync with our database to ensure the user row exists
          await fetch('/api/users/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });

          setState({
            user,
            idToken: token,
            loading: false,
          });
        } catch (error) {
          console.error("Failed to sync user on login:", error);
          setState({
            user,
            idToken: null,
            loading: false,
          });
        }
      } else {
        const isDemo = localStorage.getItem('assurx_demo_user') === 'true';
        if (isDemo) {
          const mockUser = {
            uid: 'demo-user-123',
            email: 'demo@assurx.com',
            displayName: 'Demo Patient',
            photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
            emailVerified: true,
            phoneNumber: null,
            metadata: {},
            providerData: [],
            getIdToken: async () => 'DEMO_TOKEN_BYPASS',
          } as any;
          setState({
            user: mockUser,
            idToken: 'DEMO_TOKEN_BYPASS',
            loading: false,
          });
        } else {
          setState({
            user: null,
            idToken: null,
            loading: false,
          });
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      localStorage.removeItem('assurx_demo_user');
      const result = await signInWithPopup(auth, googleAuthProvider);
      const token = await result.user.getIdToken();
      // Sync on login
      await fetch('/api/users/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      return result.user;
    } catch (error) {
      console.error("Error signing in with Google:", error);
      throw error;
    }
  };

  const loginWithDemo = async () => {
    localStorage.setItem('assurx_demo_user', 'true');
    const mockUser = {
      uid: 'demo-user-123',
      email: 'demo@assurx.com',
      displayName: 'Demo Patient',
      photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
      emailVerified: true,
      phoneNumber: null,
      metadata: {},
      providerData: [],
      getIdToken: async () => 'DEMO_TOKEN_BYPASS',
    } as any;

    try {
      // Sync the demo user on our backend too!
      await fetch('/api/users/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer DEMO_TOKEN_BYPASS'
        }
      });
    } catch (e) {
      console.error("Failed to sync demo user:", e);
    }

    setState({
      user: mockUser,
      idToken: 'DEMO_TOKEN_BYPASS',
      loading: false,
    });
    return mockUser;
  };

  const logout = async () => {
    try {
      localStorage.removeItem('assurx_demo_user');
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  };

  return {
    ...state,
    loginWithGoogle,
    loginWithDemo,
    logout,
  };
}
