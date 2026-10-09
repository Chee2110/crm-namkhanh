const API_BASE = '/api/v1';

export class ApiError extends Error {
  status: number;
  errors?: any;
  constructor(message: string, status: number, errors?: any) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

export function getActiveToken(): string | null {
  return (
    sessionStorage.getItem('namkhanh_token') ||
    (localStorage.getItem('namkhanh_remember_me') === 'true'
      ? localStorage.getItem('namkhanh_token')
      : null)
  );
}

export interface NetworkActivityState {
  activeRequests: number;
  activeMutations: number;
  isLoading: boolean;
  isMutating: boolean;
  slowRequestDetected: boolean;
  lastSuccessTimestamp?: number;
}

type NetworkListener = (state: NetworkActivityState) => void;

let activeRequests = 0;
let activeMutations = 0;
let slowTimer: any = null;
let slowRequestDetected = false;
let lastSuccessTimestamp = 0;
const listeners = new Set<NetworkListener>();

function notifyListeners() {
  const state: NetworkActivityState = {
    activeRequests,
    activeMutations,
    isLoading: activeRequests > 0,
    isMutating: activeMutations > 0,
    slowRequestDetected,
    lastSuccessTimestamp
  };

  listeners.forEach((fn) => {
    try {
      fn(state);
    } catch (err) {
      console.error(err);
    }
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('api:activity', { detail: state }));
  }
}

export function subscribeNetworkActivity(listener: NetworkListener): () => void {
  listeners.add(listener);
  listener({
    activeRequests,
    activeMutations,
    isLoading: activeRequests > 0,
    isMutating: activeMutations > 0,
    slowRequestDetected,
    lastSuccessTimestamp
  });
  return () => {
    listeners.delete(listener);
  };
}

export function getNetworkActivityState(): NetworkActivityState {
  return {
    activeRequests,
    activeMutations,
    isLoading: activeRequests > 0,
    isMutating: activeMutations > 0,
    slowRequestDetected,
    lastSuccessTimestamp
  };
}

export async function request<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; message: string; data: T; meta?: any }> {
  const method = (options.method || 'GET').toUpperCase();
  const isMutation = method !== 'GET' && method !== 'HEAD';

  activeRequests++;
  if (isMutation) {
    activeMutations++;
  }

  if (activeRequests === 1) {
    slowRequestDetected = false;
    clearTimeout(slowTimer);
    slowTimer = setTimeout(() => {
      if (activeRequests > 0) {
        slowRequestDetected = true;
        notifyListeners();
      }
    }, 1200); // Cảnh báo mạng chậm sau 1.2s
  }
  notifyListeners();

  const token = getActiveToken();

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>)
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 401) {
        sessionStorage.removeItem('namkhanh_token');
        sessionStorage.removeItem('namkhanh_user');
        localStorage.removeItem('namkhanh_token');
        localStorage.removeItem('namkhanh_user');
        localStorage.removeItem('namkhanh_remember_me');

        if (data?.code === 'CONCURRENT_LOGIN_KICK') {
          window.dispatchEvent(
            new CustomEvent('auth:concurrent-login', { detail: data.data || {} })
          );
        } else if (data?.code === 'SYSTEM_MAINTENANCE') {
          window.dispatchEvent(
            new CustomEvent('auth:system-maintenance', { detail: data.data || {} })
          );
        } else {
          window.dispatchEvent(new Event('auth:unauthorized'));
        }
      }
      throw new ApiError(data.message || 'Có lỗi xảy ra', response.status, data.errors);
    }

    if (isMutation) {
      lastSuccessTimestamp = Date.now();
    }

    return data;
  } finally {
    activeRequests = Math.max(0, activeRequests - 1);
    if (isMutation) {
      activeMutations = Math.max(0, activeMutations - 1);
    }
    if (activeRequests === 0) {
      clearTimeout(slowTimer);
      slowRequestDetected = false;
    }
    notifyListeners();
  }
}

export const api = {
  get: <T = any>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
  post: <T = any>(endpoint: string, body?: any) =>
    request<T>(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body)
    }),
  put: <T = any>(endpoint: string, body?: any) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body)
    }),
  patch: <T = any>(endpoint: string, body?: any) =>
    request<T>(endpoint, {
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body)
    }),
  delete: <T = any>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' })
};
