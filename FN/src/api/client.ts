import { ApiError } from './types/api-error';

const API_BASE = import.meta.env.VITE_API_BASE ?? '';

/**
 * 로그인 토큰은 서버가 httpOnly 쿠키로 관리합니다.
 * 스크립트에서는 토큰을 읽거나 저장하지 않고, 브라우저가 쿠키를 자동으로 붙입니다.
 * API를 다른 도메인에 둘 때(VITE_API_BASE 설정)만 credentials: 'include' 가 필요합니다.
 */
const CREDENTIALS: RequestCredentials = API_BASE ? 'include' : 'same-origin';

export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** false 이면 401 응답에도 토큰 갱신·재시도를 하지 않습니다 (로그인·회원가입 등 공개 API). */
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

/** refresh 쿠키로 access 쿠키를 새로 받습니다. 동시에 여러 요청이 401 을 받아도 한 번만 호출합니다. */
async function refreshAccessToken(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const response = await fetch(`${API_BASE}/api/auth/refresh`, {
          method: 'POST',
          credentials: CREDENTIALS,
        });
        return response.ok;
      } catch {
        return false;
      } finally {
        refreshPromise = null;
      }
    })();
  }

  return refreshPromise;
}

async function executeRequest(path: string, options: ApiRequestOptions): Promise<Response> {
  const { body, auth: _auth, skipAuthRetry: _skipAuthRetry, headers: initHeaders, ...rest } = options;
  const headers = new Headers(initHeaders);

  if (body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(`${API_BASE}${path}`, {
    ...rest,
    headers,
    credentials: CREDENTIALS,
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
