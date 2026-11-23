/**
 * 예전 버전은 로그인 토큰을 localStorage 에 저장했습니다.
 * 지금은 서버가 httpOnly 쿠키로 관리하므로, 남아 있는 예전 토큰만 지웁니다.
 */
const LEGACY_TOKEN_KEYS = ['ondo_access_token', 'ondo_refresh_token'];

export function clearLegacyStoredTokens(): void {
  try {
    LEGACY_TOKEN_KEYS.forEach((key) => localStorage.removeItem(key));
  } catch {
    // 저장소 접근이 막힌 환경(사생활 보호 모드 등)은 무시
  }
}
