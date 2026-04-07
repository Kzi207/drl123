import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  adminToken: string | null;
  login: (user: User, adminToken?: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('drl_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    return localStorage.getItem('drl_admin_token');
  });

  const login = (userData: User, token?: string) => {
    setUser(userData);
    localStorage.setItem('drl_user', JSON.stringify(userData));
    if (token) {
      setAdminToken(token);
      localStorage.setItem('drl_admin_token', token);
    }
  };

  const logout = () => {
    setUser(null);
    setAdminToken(null);
    localStorage.removeItem('drl_user');
    localStorage.removeItem('drl_admin_token');
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const newUser = { ...user, ...updates };
      setUser(newUser);
      localStorage.setItem('drl_user', JSON.stringify(newUser));
    }
  };

  return (
    <AuthContext.Provider value={{ user, adminToken, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
