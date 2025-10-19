const API_BASE = import.meta.env.DEV ? '/api' : '/api';

interface ApiError {
  message: string;
  errors?: { field: string; message: string }[];
}

class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private refreshPromise: Promise<{ accessToken: string; refreshToken: string } | null> | null = null;

  constructor() {
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    this.refreshPromise = null;
  }

  private getCsrfToken(): string | null {
    // Read CSRF token from cookie for double-submit pattern
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'XSRF-TOKEN') {
        return decodeURIComponent(value);
      }
    }
    return null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount: number = 0
  ): Promise<T> {
    const optionsHeaders = options.headers as Record<string, string> || {};
    const { Authorization: _, ...headersWithoutAuth } = optionsHeaders;
    
    // Don't set Content-Type for FormData - browser will set it with boundary
    const isFormData = options.body instanceof FormData;
    
    const headers: Record<string, string> = {
      ...headersWithoutAuth,
    };

    // Only set JSON Content-Type if not FormData and not already set
    if (!isFormData && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    // Add CSRF token header for double-submit cookie pattern
    // Required for POST, PUT, PATCH, DELETE requests
    const method = options.method?.toUpperCase() || 'GET';
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      const csrfToken = this.getCsrfToken();
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }
    }

    // ISSUE #33 FIX: Request deduplication for GET requests
    // Import at top of file is required
    const fetchFn = async () => {
      return await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include', // Ensure cookies are sent with requests
      });
    };

    // Only deduplicate GET requests (safe, idempotent operations)
    let response: Response;
    if (method === 'GET') {
      const { requestDeduplicator } = await import('./request-deduplication');
      response = await requestDeduplicator.deduplicate(
        endpoint,
        method,
        fetchFn,
        options.body
      );
    } else {
      response = await fetchFn();
    }

    if (response.status === 403 && this.refreshToken && retryCount === 0) {
      if (!this.refreshPromise) {
        this.refreshPromise = this.refreshAccessToken();
      }

      try {
        const newTokens = await this.refreshPromise;

        if (newTokens) {
          return await this.request<T>(endpoint, options, retryCount + 1);
        } else {
          this.clearTokens();
          throw { message: 'Session expired. Please log in again.' };
        }
      } finally {
        this.refreshPromise = null;
      }
    }

    if (retryCount > 0 && response.status === 403) {
      this.clearTokens();
      throw { message: 'Session expired. Please log in again.' };
    }

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        message: 'An error occurred',
      }));
      throw error;
    }

    return response.json();
  }

  private async refreshAccessToken(): Promise<{ accessToken: string; refreshToken: string } | null> {
    try {
      const headers: Record<string, string> = { 
        'Content-Type': 'application/json' 
      };

      // Add CSRF token for auth refresh endpoint
      const csrfToken = this.getCsrfToken();
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }

      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (!response.ok) {
        this.clearTokens();
        return null;
      }

      const { accessToken, refreshToken } = await response.json();
      this.setTokens(accessToken, refreshToken);
      return { accessToken, refreshToken };
    } catch {
      this.clearTokens();
      return null;
    }
  }

  async get<T>(endpoint: string, options?: { params?: Record<string, any> }): Promise<T> {
    let url = endpoint;
    if (options?.params) {
      const params = new URLSearchParams();
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
      const queryString = params.toString();
      if (queryString) {
        url = `${endpoint}?${queryString}`;
      }
    }
    return this.request<T>(url, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    const body = data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined);
    return this.request<T>(endpoint, {
      method: 'POST',
      body,
      ...options,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, options?: any): Promise<T> {
    return this.request<T>(endpoint, { 
      method: 'DELETE',
      body: options?.data ? JSON.stringify(options.data) : undefined,
    });
  }
}

export const api = new ApiClient();
export const apiClient = api;
