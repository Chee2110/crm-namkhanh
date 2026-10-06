import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { CurrentUser } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: CurrentUser | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: CurrentUser, rememberMe?: boolean) => void;
  logout: () => void;
  hasPermission: (moduleCode: string, action: 'read' | 'create' | 'update' | 'delete') => boolean;
  canViewSalary: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper lấy token hợp lệ từ sessionStorage hoặc localStorage (nếu có rememberMe)
export const getStoredAuth = (): { token: string | null; user: CurrentUser | null } => {
  // 1. Ưu tiên lấy từ sessionStorage (phiên làm việc hiện tại)
  const sessionToken = sessionStorage.getItem('namkhanh_token');
  const sessionUserStr = sessionStorage.getItem('namkhanh_user');
  if (sessionToken) {
    try {
      return { token: sessionToken, user: sessionUserStr ? JSON.parse(sessionUserStr) : null };
    } catch {
      return { token: sessionToken, user: null };
    }
  }

  // 2. Nếu người dùng đã tích chọn "Ghi nhớ đăng nhập" thì mới lấy từ localStorage
  const isRemembered = localStorage.getItem('namkhanh_remember_me') === 'true';
  if (isRemembered) {
    const localToken = localStorage.getItem('namkhanh_token');
    const localUserStr = localStorage.getItem('namkhanh_user');
    if (localToken) {
      try {
        return { token: localToken, user: localUserStr ? JSON.parse(localUserStr) : null };
      } catch {
        return { token: localToken, user: null };
      }
    }
  }

  // 3. Nếu còn tồn tại token cũ từ các phiên bản trước nhưng không có cờ remember_me:
  // Chuyển tạm sang sessionStorage để không ngắt quãng phiên hiện tại, đồng thời xóa ngay khỏi localStorage
  const legacyToken = localStorage.getItem('namkhanh_token');
  const legacyUserStr = localStorage.getItem('namkhanh_user');
  if (legacyToken) {
    sessionStorage.setItem('namkhanh_token', legacyToken);
    if (legacyUserStr) sessionStorage.setItem('namkhanh_user', legacyUserStr);
    localStorage.removeItem('namkhanh_token');
    localStorage.removeItem('namkhanh_user');
    try {
      return { token: legacyToken, user: legacyUserStr ? JSON.parse(legacyUserStr) : null };
    } catch {
      return { token: legacyToken, user: null };
    }
  }

  return { token: null, user: null };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialAuth = getStoredAuth();
  const [user, setUser] = useState<CurrentUser | null>(initialAuth.user);
  const [token, setToken] = useState<string | null>(initialAuth.token);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const channelRef = useRef<BroadcastChannel | null>(null);

  // Đồng bộ đa tab trong cùng một phiên làm việc của trình duyệt
  useEffect(() => {
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const channel = new BroadcastChannel('namkhanh_auth_channel');
        channelRef.current = channel;

        channel.onmessage = (event) => {
          const { type, payload } = event.data || {};
          if (type === 'LOGIN') {
            setToken(payload.token);
            setUser(payload.user);
            sessionStorage.setItem('namkhanh_token', payload.token);
            sessionStorage.setItem('namkhanh_user', JSON.stringify(payload.user));
            setIsLoading(false);
          } else if (type === 'LOGOUT') {
            setToken(null);
            setUser(null);
            sessionStorage.removeItem('namkhanh_token');
            sessionStorage.removeItem('namkhanh_user');
            localStorage.removeItem('namkhanh_token');
            localStorage.removeItem('namkhanh_user');
            localStorage.removeItem('namkhanh_remember_me');
          } else if (type === 'REQUEST_SESSION') {
            // Tab khác mới mở yêu cầu chia sẻ phiên làm việc đang chạy
            const curToken = sessionStorage.getItem('namkhanh_token');
            const curUser = sessionStorage.getItem('namkhanh_user');
            if (curToken && curUser) {
              channel.postMessage({
                type: 'SESSION_RESPONSE',
                payload: { token: curToken, user: JSON.parse(curUser) }
              });
            }
          } else if (type === 'SESSION_RESPONSE') {
            if (!token && payload?.token) {
              setToken(payload.token);
              setUser(payload.user);
              sessionStorage.setItem('namkhanh_token', payload.token);
              sessionStorage.setItem('namkhanh_user', JSON.stringify(payload.user));
              setIsLoading(false);
            }
          }
        };

        // Nếu tab mới mở chưa có token, phát tín hiệu hỏi các tab khác đang mở trong cùng phiên
        if (!initialAuth.token) {
          channel.postMessage({ type: 'REQUEST_SESSION' });
        }
      } catch (err) {
        console.warn('BroadcastChannel not initialized:', err);
      }
    }

    return () => {
      if (channelRef.current) {
        channelRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);

    const activeToken = sessionStorage.getItem('namkhanh_token') || (
      localStorage.getItem('namkhanh_remember_me') === 'true' ? localStorage.getItem('namkhanh_token') : null
    );

    if (activeToken) {
      api
        .get<CurrentUser>('/auth/me')
        .then((res) => {
          setUser(res.data);
          sessionStorage.setItem('namkhanh_user', JSON.stringify(res.data));
          if (localStorage.getItem('namkhanh_remember_me') === 'true') {
            localStorage.setItem('namkhanh_user', JSON.stringify(res.data));
          }
        })
        .catch(() => {
          logout();
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      // Đợi phản hồi nhanh từ tab khác (nếu có), nếu không có thì tắt loading hiển thị Login
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 100);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('auth:unauthorized', handleUnauthorized);
      };
    }

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = (newToken: string, newUser: CurrentUser, rememberMe = false) => {
    setToken(newToken);
    setUser(newUser);

    // Luôn lưu vào sessionStorage cho phiên làm việc hiện tại
    sessionStorage.setItem('namkhanh_token', newToken);
    sessionStorage.setItem('namkhanh_user', JSON.stringify(newUser));

    if (rememberMe) {
      localStorage.setItem('namkhanh_remember_me', 'true');
      localStorage.setItem('namkhanh_token', newToken);
      localStorage.setItem('namkhanh_user', JSON.stringify(newUser));
    } else {
      // Nếu không chọn ghi nhớ, xóa sạch trong localStorage để đóng trình duyệt sẽ tự đăng xuất
      localStorage.removeItem('namkhanh_remember_me');
      localStorage.removeItem('namkhanh_token');
      localStorage.removeItem('namkhanh_user');
    }

    if (channelRef.current) {
      channelRef.current.postMessage({
        type: 'LOGIN',
        payload: { token: newToken, user: newUser }
      });
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);

    // Xóa sạch toàn bộ storage
    sessionStorage.removeItem('namkhanh_token');
    sessionStorage.removeItem('namkhanh_user');
    localStorage.removeItem('namkhanh_token');
    localStorage.removeItem('namkhanh_user');
    localStorage.removeItem('namkhanh_remember_me');

    if (channelRef.current) {
      channelRef.current.postMessage({ type: 'LOGOUT' });
    }
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
