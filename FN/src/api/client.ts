import { ApiError } from './types/api-error';
import {
  clearStoredTokens,
  getAccessToken,
  getRefreshToken,
  setStoredTokens,
} from '../auth/tokenStorage';

const API_BASE = import.meta.env.VITE_API_BASE ?? '';

export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  auth?: boolean;
  skipAuthRetry?: boolean;
}

let refreshPromise: Promise<boolean> | null = null;

async function parseResponsePayload(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return undefined;
  }

  const contentType = response.headers.get('Content-Type') ?? '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  return response.text();
}

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return false;
  }

  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const response = await fetch(`${API_BASE}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        const payload = await parseResponsePayload(response);

        if (!response.ok) {
          clearStoredTokens();
          return false;
        }

        const data = payload as { accessToken: string; refreshToken: string };
        setStoredTokens(data.accessToken, data.refreshToken);
        return true;
      } catch {
        clearStoredTokens();
        return false;
      } finally {
        refreshPromise = null;
      }
    })();
  }

  return refreshPromise;
}

async function executeRequest(
  path: string,
  options: ApiRequestOptions,
): Promise<Response> {
  const { body, auth = true, headers: initHeaders, ...rest } = options;
  const headers = new Headers(initHeaders);

  if (body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (auth) {
    const token = getAccessToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  return fetch(`${API_BASE}${path}`, {
    ...rest,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export async function apiClient<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  let response = await executeRequest(path, options);

  if (response.status === 401 && options.auth !== false && !options.skipAuthRetry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      response = await executeRequest(path, { ...options, skipAuthRetry: true });
    }
  }

  const payload = await parseResponsePayload(response);

  if (!response.ok) {
    const message =
      typeof payload === 'object' && payload !== null && 'message' in payload
        ? String((payload as { message: unknown }).message)
        : `요청을 처리하지 못했어요 (${response.status})`;

    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}

export { clearStoredTokens, getAccessToken, getRefreshToken, setStoredTokens };
