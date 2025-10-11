import { csrfManager } from './csrf-manager';

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

  /**
   * Get CSRF token using the atomic CSRF manager
   */
  private async getCsrfToken(): Promise<string | null> {
    // Use centralized CSRF manager
    const token = csrfManager.getToken();
    
    // If no token and not ready, try to initialize
    if (!token && !csrfManager.isReady()) {
      // Try to initialize atomically
      await csrfManager.initialize();
      return csrfManager.getToken();
    }
    
    return token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount: number = 0
  ): Promise<T> {
    const optionsHeaders = options.headers as Record<string, string> || {};
    const { Authorization: _, ...headersWithoutAuth } = optionsHeaders;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headersWithoutAuth,
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    // Add CSRF token header for double-submit cookie pattern
    // Required for POST, PUT, PATCH, DELETE requests
    const method = options.method?.toUpperCase();
    if (method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      const csrfToken = await this.getCsrfToken();
      
      // Block sensitive actions if CSRF bootstrap failed
      if (!csrfToken && csrfManager.getState() === 'failed') {
        throw { 
          message: 'CSRF protection unavailable. Please refresh the page to continue.',
          code: 'CSRF_BOOTSTRAP_FAILED'
        };
      }
      
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }
    }

    let response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include', // Ensure cookies are sent with requests
    });

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
      const csrfToken = await this.getCsrfToken();
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

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient();
export const apiClient = api;
