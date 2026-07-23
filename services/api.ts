import {
  DashboardStats,
  SubscriptionCode,
  Subscription,
  MyMovie,
  Category,
  SystemConfig,
  XtreamServerConfig,
  ActivityLog,
  XtreamVodCategory,
  XtreamVodStream,
  XtreamVodInfo,
  XtreamSeriesCategory,
  XtreamSeriesItem,
  XtreamSeriesInfo,
  ActivateCodePayload,
  ActivateCodeResponse
} from '../types';

const TOKEN_KEY = 'viu_jwt_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Erreur lors de la requête API');
  }

  return data as T;
}

export const api = {
  // Auth
  login: async (username: string, password: string) => {
    const res = await request<{ success: boolean; token: string; user: any; error?: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    if (res.token) {
      setStoredToken(res.token);
    }
    return res;
  },

  checkMe: async () => {
    return request<{ success: boolean; user: any }>('/api/auth/me');
  },

  logout: () => {
    removeStoredToken();
  },

  // Dashboard
  getDashboardStats: async () => {
    return request<{ success: boolean; stats: DashboardStats }>('/api/dashboard/stats');
  },

  // Code Activation (POST /api/users/activate-code)
  activateCode: async (payload: ActivateCodePayload) => {
    return request<ActivateCodeResponse>('/api/users/activate-code', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // Codes
  getCodes: async (search: string = '', status: string = 'all') => {
    const params = new URLSearchParams({ search, status });
    return request<{ success: boolean; codes: SubscriptionCode[] }>(`/api/codes?${params.toString()}`);
  },

  createCode: async (data: { custom_code?: string; client_name?: string; duration?: number }) => {
    return request<{ success: boolean; code: SubscriptionCode }>('/api/codes', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  createBulkCodes: async (data: { count: number; duration: number; client_prefix?: string }) => {
    return request<{ success: boolean; count: number; codes: SubscriptionCode[] }>('/api/codes/bulk', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  updateCode: async (id: string, data: Partial<SubscriptionCode>) => {
    return request<{ success: boolean; code: SubscriptionCode }>(`/api/codes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  deleteCode: async (id: string) => {
    return request<{ success: boolean; message: string }>(`/api/codes/${id}`, {
      method: 'DELETE'
    });
  },

  // Subscriptions
  getSubscriptions: async (search: string = '', status: string = 'all') => {
    const params = new URLSearchParams({ search, status });
    return request<{ success: boolean; subscriptions: Subscription[] }>(`/api/subscriptions?${params.toString()}`);
  },

  updateSubscription: async (id: string, data: { action?: 'suspend' | 'reactivate' | 'extend'; durationMonths?: number; client?: string; status?: string }) => {
    return request<{ success: boolean; subscription: Subscription }>(`/api/subscriptions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  deleteSubscription: async (id: string) => {
    return request<{ success: boolean; message: string }>(`/api/subscriptions/${id}`, {
      method: 'DELETE'
    });
  },

  // My Movies
  getMyMovies: async () => {
    return request<{ success: boolean; movies: MyMovie[] }>('/api/my-movies');
  },

  createMyMovie: async (data: Omit<MyMovie, 'id' | 'added_at' | 'category_name'>) => {
    return request<{ success: boolean; movie: MyMovie }>('/api/my-movies', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  updateMyMovie: async (id: string, data: Partial<MyMovie>) => {
    return request<{ success: boolean; movie: MyMovie }>(`/api/my-movies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  deleteMyMovie: async (id: string) => {
    return request<{ success: boolean; message: string }>(`/api/my-movies/${id}`, {
      method: 'DELETE'
    });
  },

  // Categories (UI Organization)
  getCategories: async () => {
    return request<{ success: boolean; categories: Category[] }>('/api/categories');
  },

  createCategory: async (data: { name: string; server_id: 'movies' | 'series' | 'shahid'; hidden?: boolean }) => {
    return request<{ success: boolean; category: Category }>('/api/categories', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  updateCategory: async (id: string, data: { name?: string; order?: number; hidden?: boolean; server_id?: 'movies' | 'series' | 'shahid' }) => {
    return request<{ success: boolean; category: Category }>(`/api/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  deleteCategory: async (id: string) => {
    return request<{ success: boolean; message: string }>(`/api/categories/${id}`, {
      method: 'DELETE'
    });
  },

  // Configuration
  getConfig: async () => {
    return request<{ success: boolean; config: SystemConfig; servers: Record<'movies' | 'series' | 'shahid', XtreamServerConfig> }>('/api/config');
  },

  updateConfig: async (data: Partial<SystemConfig>) => {
    return request<{ success: boolean; config: SystemConfig }>('/api/config', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  updateServerConfig: async (serverId: 'movies' | 'series' | 'shahid', data: Partial<XtreamServerConfig>) => {
    return request<{ success: boolean; server: XtreamServerConfig }>(`/api/servers/${serverId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  testServerConnection: async (serverId: 'movies' | 'series' | 'shahid', data?: { host?: string; username?: string; password?: string }) => {
    return request<{ success: boolean; status: string; message?: string; error?: string }>(`/api/servers/${serverId}/test`, {
      method: 'POST',
      body: JSON.stringify(data || {})
    });
  },

  restoreBackup: async (jsonData: any) => {
    return request<{ success: boolean; message: string }>('/api/config/restore', {
      method: 'POST',
      body: JSON.stringify(jsonData)
    });
  },

  // Activity Logs
  getLogs: async (type: string = 'all', search: string = '') => {
    const params = new URLSearchParams({ type, search });
    return request<{ success: boolean; logs: ActivityLog[] }>(`/api/logs?${params.toString()}`);
  },

  clearLogs: async () => {
    return request<{ success: boolean; message: string }>('/api/logs', {
      method: 'DELETE'
    });
  },

  // Xtream Proxy Methods
  getXtreamMoviesCategories: async () => {
    return request<{ success: boolean; categories: XtreamVodCategory[] }>('/api/xtream/movies/categories');
  },

  getXtreamMoviesStreams: async (categoryId?: string) => {
    const query = categoryId ? `?category_id=${categoryId}` : '';
    return request<{ success: boolean; streams: XtreamVodStream[] }>(`/api/xtream/movies/streams${query}`);
  },

  getXtreamMovieInfo: async (vodId: string | number) => {
    return request<{ success: boolean; info: XtreamVodInfo }>(`/api/xtream/movies/info?vod_id=${vodId}`);
  },

  getXtreamSeriesCategories: async () => {
    return request<{ success: boolean; categories: XtreamSeriesCategory[] }>('/api/xtream/series/categories');
  },

  getXtreamSeriesItems: async (categoryId?: string) => {
    const query = categoryId ? `?category_id=${categoryId}` : '';
    return request<{ success: boolean; series: XtreamSeriesItem[] }>(`/api/xtream/series/items${query}`);
  },

  getXtreamSeriesInfo: async (seriesId: string | number) => {
    return request<{ success: boolean; info: XtreamSeriesInfo }>(`/api/xtream/series/info?series_id=${seriesId}`);
  },

  getXtreamShahidCategories: async () => {
    return request<{ success: boolean; categories: XtreamSeriesCategory[] }>('/api/xtream/shahid/categories');
  },

  getXtreamShahidItems: async (categoryId?: string) => {
    const query = categoryId ? `?category_id=${categoryId}` : '';
    return request<{ success: boolean; series: XtreamSeriesItem[] }>(`/api/xtream/shahid/items${query}`);
  },

  getXtreamShahidInfo: async (seriesId: string | number) => {
    return request<{ success: boolean; info: XtreamSeriesInfo }>(`/api/xtream/shahid/info?series_id=${seriesId}`);
  },

  triggerGlobalSync: async () => {
    return request<{ success: boolean; message: string }>('/api/servers/sync-all', {
      method: 'POST'
    });
  },

  testCodeActivation: async (code: string) => {
    return request<{ success: boolean; subscription: Subscription; error?: string }>('/api/users/activate-code', {
      method: 'POST',
      body: JSON.stringify({ code })
    });
  }
};
