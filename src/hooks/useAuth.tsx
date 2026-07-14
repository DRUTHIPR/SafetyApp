import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth } from '../services/firebase';

interface User {
  uid: string;
  email: string;
  displayName?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (auth) {
      // Real Firebase auth
      const { onAuthStateChanged } = require('firebase/auth');
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || undefined,
          });
        } else {
          setUser(null);
        }
        setLoading(false);
      });
      return unsubscribe;
    } else {
      // Demo mode fallback
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      if (auth) {
        // Real Firebase login
        const { signInWithEmailAndPassword } = require('firebase/auth');
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // Demo fallback
        await new Promise(resolve => setTimeout(resolve, 1000));
        setUser({
          uid: 'demo-user-' + Date.now(),
          email,
          displayName: email.split('@')[0],
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string) => {
    setLoading(true);
    try {
      if (auth) {
        // Real Firebase signup
        const { createUserWithEmailAndPassword } = require('firebase/auth');
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        // Demo fallback
        await new Promise(resolve => setTimeout(resolve, 1000));
        setUser({
          uid: 'demo-user-' + Date.now(),
          email,
          displayName: email.split('@')[0],
        });
      }
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (auth) {
        const { signOut } = require('firebase/auth');
        await signOut(auth);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}