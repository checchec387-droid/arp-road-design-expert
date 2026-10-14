import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser } from '../types/auth';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (identifier: string, password: string, requireAdmin?: boolean) => Promise<{ success: boolean; error?: string; status?: string; isAdminLogin?: boolean }>;
  register: (data: { name: string; email: string; password: string; jobTitle: string; organization?: string; username?: string }) => Promise<{ success: boolean; error?: string; message?: string; status?: string }>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message?: string; error?: string; directResetUrl?: string; resetToken?: string; resetCode?: string; isSmtpConfigured?: boolean; userFound?: boolean }>;
  resetPassword: (token: string, newPassword: string, email?: string) => Promise<{ success: boolean; message?: string; error?: string; user?: AuthUser }>;
  refreshUser: () => Promise<void>;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const storedToken = localStorage.getItem('arp_token');
      const headers: Record<string, string> = {};
      if (storedToken) {
        headers['Authorization'] = `Bearer ${storedToken}`;
      }
      const res = await fetch('/api/auth/me', {
        headers,
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (identifier: string, password: string, requireAdmin: boolean = false) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ identifier, password, requireAdmin })
      });
      const data = await res.json();
      if (data.success && data.user) {
        if (data.token) {
          localStorage.setItem('arp_token', data.token);
        }
        setUser(data.user);
        return { success: true, isAdminLogin: !!data.isAdminLogin };
      }
      return { success: false, error: data.error, status: data.status };
    } catch (err: any) {
      return { success: false, error: 'Connexion au serveur impossible.' };
    }
  };

  const register = async (formData: { name: string; email: string; password: string; jobTitle: string; organization?: string; username?: string }) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        if (data.token) {
          localStorage.setItem('arp_token', data.token);
        }
        if (data.user) {
          setUser(data.user);
        }
        return { success: true, message: data.message, status: data.status };
      }
      return { success: false, error: data.error };
    } catch (err: any) {
      return { success: false, error: 'Erreur de communication avec le serveur.' };
    }
  };

  const logout = async () => {
    try {
      const storedToken = localStorage.getItem('arp_token');
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: storedToken ? { 'Authorization': `Bearer ${storedToken}` } : {},
        credentials: 'include'
      });
    } finally {
      localStorage.removeItem('arp_token');
      setUser(null);
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (data.success) {
        return {
          success: true,
          message: data.message,
          directResetUrl: data.directResetUrl,
          resetToken: data.resetToken,
          resetCode: data.resetCode,
          isSmtpConfigured: data.isSmtpConfigured,
          userFound: data.userFound
        };
      }
      return { success: false, error: data.error };
    } catch {
      return { success: false, error: 'Erreur lors de la demande de réinitialisation.' };
    }
  };

  const resetPassword = async (token: string, newPassword: string, email?: string) => {
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword, email })
      });
      const data = await res.json();
      if (data.success) {
        if (data.user) {
          setUser(data.user);
        }
        return { success: true, message: data.message, user: data.user };
      }
      return { success: false, error: data.error };
    } catch {
      return { success: false, error: 'Erreur lors de la réinitialisation.' };
    }
  };

  const adminEmails = ['youcefyoucefbelallia@gmail.com', 'checchec387@gmail.com'];
  const isAdmin = !!(user && (user.role === 'SUPERADMIN' || user.role === 'ADMIN' || adminEmails.includes(user.email.toLowerCase())));
  const isSuperAdmin = !!(user && (user.role === 'SUPERADMIN' || adminEmails.includes(user.email.toLowerCase())));

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        forgotPassword,
        resetPassword,
        refreshUser,
        isAdmin,
        isSuperAdmin
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
