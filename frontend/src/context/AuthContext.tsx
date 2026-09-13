import React, { createContext, useContext, useState, useEffect } from 'react';
import { CurrentUser } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: CurrentUser | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: CurrentUser) => void;
  logout: () => void;
  hasPermission: (moduleCode: string, action: 'read' | 'create' | 'update' | 'delete') => boolean;
  canViewSalary: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<CurrentUser | null>(() => {
    const saved = localStorage.getItem('namkhanh_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('namkhanh_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);

    // Xác thực lại token khi khởi động
    if (token) {
      api
        .get<CurrentUser>('/auth/me')
        .then((res) => {
          setUser(res.data);
          localStorage.setItem('namkhanh_user', JSON.stringify(res.data));
        })
        .catch(() => {
          logout();
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = (newToken: string, newUser: CurrentUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('namkhanh_token', newToken);
    localStorage.setItem('namkhanh_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('namkhanh_token');
    localStorage.removeItem('namkhanh_user');
  };

  const hasPermission = (
    moduleCode: string,
    action: 'read' | 'create' | 'update' | 'delete'
  ): boolean => {
    if (!user) return false;
    if (user.roles.includes('ADMIN') || user.roles.includes('CEO')) return true;

    const perm = user.permissions.find((p) => p.moduleCode === moduleCode);
    if (!perm) return false;

    switch (action) {
      case 'read':
        return perm.canRead;
      case 'create':
        return perm.canCreate;
      case 'update':
        return perm.canUpdate;
      case 'delete':
        return perm.canDelete;
      default:
        return false;
    }
  };

  const canViewSalary = Boolean(
    user && (user.roles.includes('ADMIN') || user.roles.includes('CEO'))
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        hasPermission,
        canViewSalary
      }}
    >
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
