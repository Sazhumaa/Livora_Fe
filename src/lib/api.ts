/**
 * AFTERGLOW Central API Client
 * Built-in JWT interceptor, auto-refresh token, standardized error envelope.
 */

const BASE_URL = (import.meta.env.PUBLIC_API_URL || 'http://localhost:3000').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(
    public status: number,
    public errorCode: string,
    message: string,
    public details?: any,
    public requestId?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
  session?: string;
  tokens?: {
    access_token: string;
    refresh_token: string;
  };
  error_code?: string;
  request_id?: string;
  details?: any;
}

export interface RequestOptions extends RequestInit {
  token?: string;
  idempotencyKey?: string;
  skipAuthRefresh?: boolean;
}

/**
 * Low-level HTTP requester with automatic token refresh on 401
 */
export async function request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { token, idempotencyKey, skipAuthRefresh = false, ...fetchOpts } = options;

  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const headers = new Headers(fetchOpts.headers || {});

  // Set default Content-Type if body is not FormData
  if (!(fetchOpts.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Inject Authorization Token
  const activeToken = token || (typeof window !== 'undefined' ? localStorage.getItem('afterglow_access_token') : null);
  if (activeToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${activeToken}`);
  }

  // Inject Idempotency-Key if provided
  if (idempotencyKey) {
    headers.set('Idempotency-Key', idempotencyKey);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...fetchOpts,
      headers,
    });
  } catch (err: any) {
    throw new ApiError(
      0,
      'NETWORK_ERROR',
      'Tidak dapat terhubung ke server. Periksa koneksi internet Anda atau pastikan server aktif.',
      err.message
    );
  }

  // Handle Token Expiry & Automatic Refresh (Status 401)
  if (response.status === 401 && !skipAuthRefresh && typeof window !== 'undefined') {
    const refreshToken = localStorage.getItem('afterglow_refresh_token');
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        const refreshJson: ApiResponse = await refreshRes.json();

        if (refreshRes.ok && refreshJson.success && refreshJson.data?.access_token) {
          localStorage.setItem('afterglow_access_token', refreshJson.data.access_token);
          if (refreshJson.data.refresh_token) {
            localStorage.setItem('afterglow_refresh_token', refreshJson.data.refresh_token);
          }

          // Retry original request with newly refreshed token
          headers.set('Authorization', `Bearer ${refreshJson.data.access_token}`);
          const retryRes = await fetch(url, { ...fetchOpts, headers });
          return parseResponse<T>(retryRes);
        } else {
          // Refresh token invalid or expired -> logout user
          clearAuthTokens();
        }
      } catch {
        clearAuthTokens();
      }
    } else {
      clearAuthTokens();
    }
  }

  return parseResponse<T>(response);
}

async function parseResponse<T>(response: Response): Promise<T> {
  const json: ApiResponse<T> = await response.json().catch(() => ({
    success: false,
    error_code: 'INVALID_JSON_RESPONSE',
    message: `Respon server tidak valid (${response.status} ${response.statusText})`,
  } as any));

  if (!response.ok || json.success === false) {
    const message = json.message || 'Terjadi kesalahan sistem saat memproses permintaan';
    const errorCode = json.error_code || `HTTP_${response.status}`;
    throw new ApiError(response.status, errorCode, message, json.details, json.request_id);
  }

  return (json.data !== undefined ? json.data : (json as any)) as T;
}

function clearAuthTokens() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('afterglow_access_token');
  localStorage.removeItem('afterglow_refresh_token');
  localStorage.removeItem('afterglow_user');
  window.dispatchEvent(new CustomEvent('afterglow-auth-changed', { detail: { user: null } }));
}

/**
 * Convenient REST API methods
 */
export const api = {
  get: <T = any>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { method: 'GET', ...options }),

  post: <T = any>(endpoint: string, body?: any, options?: RequestOptions) =>
    request<T>(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
      ...options,
    }),

  patch: <T = any>(endpoint: string, body?: any, options?: RequestOptions) =>
    request<T>(endpoint, {
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body),
      ...options,
    }),

  delete: <T = any>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { method: 'DELETE', ...options }),

  upload: <T = any>(endpoint: string, formData: FormData, options?: RequestOptions) =>
    request<T>(endpoint, {
      method: 'POST',
      body: formData,
      ...options,
    }),
};
