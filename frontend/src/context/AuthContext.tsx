import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { CurrentUser } from '../types';
import { api } from '../services/api';

interface ConcurrentLoginData {
  newDevice?: string;
  newIp?: string;
  loginAt?: string;
}

interface AuthContextType {
  user: CurrentUser | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: CurrentUser, rememberMe?: boolean, maintenanceNotice?: { lastEndedAt?: string | null }) => void;
  logout: () => void;
  hasPermission: (moduleCode: string, action: 'read' | 'create' | 'update' | 'delete') => boolean;
  canViewSalary: boolean;
  concurrentLoginInfo: ConcurrentLoginData | null;
  clearConcurrentLoginInfo: () => void;
  isMaintenanceActive: boolean;
  setIsMaintenanceActive: (active: boolean) => void;
  welcomeBackNotice: boolean;
  dismissWelcomeBackNotice: () => void;
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
  const [concurrentLoginInfo, setConcurrentLoginInfo] = useState<ConcurrentLoginData | null>(null);
  const [isMaintenanceActive, setIsMaintenanceActive] = useState<boolean>(false);
  const [welcomeBackNotice, setWelcomeBackNotice] = useState<boolean>(false);
  const channelRef = useRef<BroadcastChannel | null>(null);

  // Lắng nghe các sự kiện bảo mật từ api.ts
  useEffect(() => {
    const handleConcurrent = (e: any) => {
      setConcurrentLoginInfo(e.detail || { newDevice: 'Thiết bị khác' });
      logout();
    };

    const handleMaintenance = () => {
      setIsMaintenanceActive(true);
      logout();
    };

    window.addEventListener('auth:concurrent-login', handleConcurrent);
    window.addEventListener('auth:system-maintenance', handleMaintenance);

    return () => {
      window.removeEventListener('auth:concurrent-login', handleConcurrent);
      window.removeEventListener('auth:system-maintenance', handleMaintenance);
    };
  }, []);

  // Heartbeat kiểm tra tính hợp lệ của phiên và chế độ bảo trì thời gian thực (mỗi 4 giây)
  useEffect(() => {
    if (!token || !user) return;

    const checkInterval = setInterval(async () => {
      try {
        const res = await api.get('/system/session-check');
        if (res.data?.maintenance) {
          setIsMaintenanceActive(Boolean(res.data.maintenance.isMaintenance));
        }
      } catch (err: any) {
        // Nếu phiên bị thu hồi do đăng nhập thiết bị khác, api.ts sẽ tự bắn auth:concurrent-login
      }
    }, 4000);

    return () => clearInterval(checkInterval);
  }, [token, user]);

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

  const login = (
    newToken: string,
    newUser: CurrentUser,
    rememberMe = false,
    maintenanceNotice?: { lastEndedAt?: string | null }
  ) => {
    setToken(newToken);
    setUser(newUser);
    setConcurrentLoginInfo(null);
    setIsMaintenanceActive(false);

    // Kiểm tra xem lần đăng nhập này có phải là sau khi bảo trì xong không
    if (maintenanceNotice?.lastEndedAt) {
      const ackEndedAt = localStorage.getItem('namkhanh_ack_maintenance_ended');
      if (!ackEndedAt || new Date(maintenanceNotice.lastEndedAt) > new Date(ackEndedAt)) {
        setWelcomeBackNotice(true);
      }
    }

    sessionStorage.setItem('namkhanh_token', newToken);
    sessionStorage.setItem('namkhanh_user', JSON.stringify(newUser));

    if (rememberMe) {
      localStorage.setItem('namkhanh_remember_me', 'true');
      localStorage.setItem('namkhanh_token', newToken);
      localStorage.setItem('namkhanh_user', JSON.stringify(newUser));
    } else {
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

    sessionStorage.removeItem('namkhanh_token');
    sessionStorage.removeItem('namkhanh_user');
    localStorage.removeItem('namkhanh_token');
    localStorage.removeItem('namkhanh_user');
    localStorage.removeItem('namkhanh_remember_me');

    if (channelRef.current) {
      channelRef.current.postMessage({ type: 'LOGOUT' });
    }
  };

  const clearConcurrentLoginInfo = () => {
    setConcurrentLoginInfo(null);
  };

  const dismissWelcomeBackNotice = () => {
    localStorage.setItem('namkhanh_ack_maintenance_ended', new Date().toISOString());
    setWelcomeBackNotice(false);
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
        canViewSalary,
        concurrentLoginInfo,
        clearConcurrentLoginInfo,
        isMaintenanceActive,
        setIsMaintenanceActive,
        welcomeBackNotice,
        dismissWelcomeBackNotice
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
