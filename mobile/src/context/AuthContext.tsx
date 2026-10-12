import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { apiClient } from '../api/client';

export type UserRole = 'OWNER' | 'SALESPERSON';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  username: string;
  role: UserRole;
  permissions: string[];
  store?: {
    id: string;
    name: string;
    currency: string;
    currencySymbol: string;
  } | null;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  isOwner: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  isOwner: false,
  login: async () => {},
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const saveToken = async (newToken: string | null) => {
    try {
      if (Platform.OS !== 'web') {
        if (newToken) {
          await SecureStore.setItemAsync('freshstock_auth_token', newToken);
        } else {
          await SecureStore.deleteItemAsync('freshstock_auth_token');
        }
      } else {
        if (newToken) {
          localStorage.setItem('freshstock_auth_token', newToken);
        } else {
          localStorage.removeItem('freshstock_auth_token');
        }
      }
    } catch (e) {
      console.warn('[AuthContext] Storage error:', e);
    }
  };

  const loadSavedAuth = async () => {
    try {
      let savedToken: string | null = null;
      if (Platform.OS !== 'web') {
        savedToken = await SecureStore.getItemAsync('freshstock_auth_token');
      } else {
        savedToken = typeof window !== 'undefined' ? localStorage.getItem('freshstock_auth_token') : null;
      }

      if (savedToken) {
        setToken(savedToken);
        const res = await apiClient.get('/auth/me', {
          headers: { Authorization: `Bearer ${savedToken}` },
        });
        if (res.data?.success && res.data?.user) {
          setUser(res.data.user);
        }
      }
    } catch (err) {
      console.warn('[AuthContext] Session expired or cannot reach server:', err);
      await saveToken(null);
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSavedAuth();
  }, []);

  const login = async (identifier: string, password: string) => {
    const res = await apiClient.post('/auth/login', { identifier, password });
    if (res.data?.success) {
      const receivedToken = res.data.token;
      const receivedUser = res.data.user;
      setToken(receivedToken);
      setUser(receivedUser);
      await saveToken(receivedToken);
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (err) {
      // ignore
    } finally {
      await saveToken(null);
      setToken(null);
      setUser(null);
    }
  };

  const isOwner = user?.role === 'OWNER';

  return (
    <AuthContext.Provider value={{ user, token, isLoading, isOwner, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
