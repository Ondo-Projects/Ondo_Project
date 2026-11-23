import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { getMe, login as loginRequest, logout as logoutRequest } from '../api/auth.api';
import type { AuthUser, LoginRequest } from '../api/types/auth';
import { clearLegacyStoredTokens } from './tokenStorage';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (request: LoginRequest) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<AuthUser | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * 로그인 여부는 서버에 물어봅니다. 토큰은 httpOnly 쿠키라 스크립트에서 확인할 수 없습니다.
 * access 토큰이 만료됐으면 apiClient 가 refresh 쿠키로 한 번 갱신한 뒤 다시 시도합니다.
 */
async function fetchCurrentUser(): Promise<AuthUser | null> {
  try {
    return await getMe();
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    clearLegacyStoredTokens();

    fetchCurrentUser()
      .then((profile) => {
        if (!cancelled) {
          setUser(profile);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (request: LoginRequest) => {
    await loginRequest(request);
    const profile = await getMe();
    setUser(profile);
    return profile;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch {
      // 서버 요청이 실패해도 화면의 로그인 상태는 정리
    } finally {
      setUser(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    const profile = await fetchCurrentUser();
    setUser(profile);
    return profile;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      login,
      logout,
      refreshProfile,
    }),
    [user, isLoading, login, logout, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
