/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types.js';
import { api } from '../services/api.js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<User>;
  signUp: (signUpData: {
    email: string;
    password?: string;
    name: string;
    role: string;
    techLeadId?: string | null;
  }) => Promise<User>;
  logout: () => void;
  refreshCurrentUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);



export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    
    const checkAuth = async () => {
      try {
        const { getSupabaseClient } = await import('../lib/supabaseClient.js');
        const supabase = await getSupabaseClient();
        
        // Check current session
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          const users = await api.getUsers();
          const dbUser = users.find(u => u.email.toLowerCase() === session.user.email?.toLowerCase());
          if (dbUser) {
            setUser(dbUser);
            sessionStorage.setItem('user', JSON.stringify(dbUser));
          }
        } else {
          // Fallback to demo switcher sessionStorage
          const savedUserStr = sessionStorage.getItem('user');
          if (savedUserStr) {
            const savedUser = JSON.parse(savedUserStr);
            const users = await api.getUsers();
            const freshUser = users.find(u => u.id === savedUser.id);
            if (freshUser) {
              setUser(freshUser);
            } else {
              sessionStorage.removeItem('user');
            }
          }
        }

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
          if (event === 'SIGNED_IN' && currentSession?.user) {
            try {
              const users = await api.getUsers();
              const dbUser = users.find(u => u.email.toLowerCase() === currentSession.user.email?.toLowerCase());
              if (dbUser) {
                setUser(dbUser);
                sessionStorage.setItem('user', JSON.stringify(dbUser));
              }
            } catch (err) {
              console.error("Error fetching db user on auth change:", err);
            }
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
            sessionStorage.removeItem('user');
          }
        });

        unsubscribe = () => {
          subscription.unsubscribe();
        };
      } catch (e) {
        console.warn("Supabase auth listener not initialized or missing config. Falling back to local state.", e);
        // Simple local storage restore
        const savedUserStr = sessionStorage.getItem('user');
        if (savedUserStr) {
          try {
            const savedUser = JSON.parse(savedUserStr);
            setUser(savedUser);
          } catch {
            sessionStorage.removeItem('user');
          }
        }
      } finally {
        setLoading(false);
      }
    };
    checkAuth();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const login = async (email: string, password?: string): Promise<User> => {
    setLoading(true);
    try {
      const { user: loggedInUser } = await api.login(email, password);
      setUser(loggedInUser);
      sessionStorage.setItem('user', JSON.stringify(loggedInUser));
      return loggedInUser;
    } catch (error) {
      setLoading(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (signUpData: {
    email: string;
    password?: string;
    name: string;
    role: string;
    techLeadId?: string | null;
  }): Promise<User> => {
    setLoading(true);
    try {
      // 1. Check if email already exists in database
      const exists = await api.checkEmailExists(signUpData.email);
      if (exists) {
        throw new Error("This email is already registered in the database.");
      }

      const authUserId = `u-${Date.now()}`;

      // 3. Create standard Prisma User row
      const { user: createdUser } = await api.registerUser({
        id: authUserId,
        email: signUpData.email,
        password: signUpData.password,
        name: signUpData.name,
        role: signUpData.role,
        techLeadId: signUpData.techLeadId
      });

      setUser(createdUser);
      sessionStorage.setItem('user', JSON.stringify(createdUser));
      return createdUser;
    } catch (error) {
      setLoading(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const { getSupabaseClient } = await import('../lib/supabaseClient.js');
      const supabase = await getSupabaseClient();
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("Could not sign out of Supabase Auth, clearing local state", e);
    }
    setUser(null);
    sessionStorage.removeItem('user');
  };

  const refreshCurrentUser = async () => {
    if (!user) return;
    try {
      const users = await api.getUsers();
      const freshUser = users.find(u => u.id === user.id);
      if (freshUser) {
        setUser(freshUser);
        sessionStorage.setItem('user', JSON.stringify(freshUser));
      }
    } catch (e) {
      console.error("Failed to refresh user", e);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      signUp,
      logout, 
      refreshCurrentUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
