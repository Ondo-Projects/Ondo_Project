package com.ondo.global.security;

import com.ondo.global.config.JwtProperties;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.time.Duration;

/**
 * 로그인 토큰을 httpOnly 쿠키로 주고받습니다.
 * <ul>
 *   <li>httpOnly — 브라우저 스크립트(XSS)가 토큰을 읽을 수 없음</li>
 *   <li>Secure — HTTPS 로만 전송</li>
 *   <li>SameSite=Strict — 다른 사이트에서 시작된 요청에는 쿠키가 붙지 않음(CSRF 방지)</li>
 *   <li>refresh 토큰은 /api/auth 경로(갱신·로그아웃·탈퇴)에만 전송</li>
 * </ul>
 */
@Component
@RequiredArgsConstructor
public class TokenCookieService {

    public static final String ACCESS_TOKEN_COOKIE = "accessToken";
    public static final String REFRESH_TOKEN_COOKIE = "refreshToken";
    private static final String ACCESS_TOKEN_PATH = "/";
    private static final String REFRESH_TOKEN_PATH = "/api/auth";
    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtProperties jwtProperties;

    public void writeTokens(HttpServletResponse response, String accessToken, String refreshToken) {
        addCookie(response, ACCESS_TOKEN_COOKIE, accessToken, ACCESS_TOKEN_PATH,
                Duration.ofMillis(jwtProperties.getAccessTokenExpiration()));
        addCookie(response, REFRESH_TOKEN_COOKIE, refreshToken, REFRESH_TOKEN_PATH,
                Duration.ofMillis(jwtProperties.getRefreshTokenExpiration()));
        // 예전 버전이 path=/ 로 만든 refresh 쿠키가 남아 있으면 정리
        addCookie(response, REFRESH_TOKEN_COOKIE, "", ACCESS_TOKEN_PATH, Duration.ZERO);
    }

    public void clearTokens(HttpServletResponse response) {
        clearAccessToken(response);
        addCookie(response, REFRESH_TOKEN_COOKIE, "", REFRESH_TOKEN_PATH, Duration.ZERO);
        addCookie(response, REFRESH_TOKEN_COOKIE, "", ACCESS_TOKEN_PATH, Duration.ZERO);
    }

    /** 만료·무효 access 토큰만 지웁니다. refresh 토큰은 남겨 두어 자동 갱신이 가능하게 합니다. */
    public void clearAccessToken(HttpServletResponse response) {
        addCookie(response, ACCESS_TOKEN_COOKIE, "", ACCESS_TOKEN_PATH, Duration.ZERO);
    }

    public String resolveAccessToken(HttpServletRequest request) {
        return resolveCookieValue(request, ACCESS_TOKEN_COOKIE);
    }

    public String resolveRefreshToken(HttpServletRequest request) {
        return resolveCookieValue(request, REFRESH_TOKEN_COOKIE);
    }

    public String resolveBearerToken(HttpServletRequest request) {
        String authorizationHeader = request.getHeader(AUTHORIZATION_HEADER);
        if (!StringUtils.hasText(authorizationHeader) || !authorizationHeader.startsWith(BEARER_PREFIX)) {
            return null;
        }
        return authorizationHeader.substring(BEARER_PREFIX.length()).trim();
    }

    public String resolveAccessTokenFromRequest(HttpServletRequest request) {
        String bearerToken = resolveBearerToken(request);
        if (StringUtils.hasText(bearerToken)) {
            return bearerToken;
        }
        return resolveAccessToken(request);
    }

    private String resolveCookieValue(HttpServletRequest request, String cookieName) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }

        for (Cookie cookie : cookies) {
            if (cookieName.equals(cookie.getName()) && StringUtils.hasText(cookie.getValue())) {
                return cookie.getValue();
            }
        }
        return null;
    }

    private void addCookie(HttpServletResponse response, String name, String value, String path, Duration maxAge) {
        ResponseCookie cookie = ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(jwtProperties.isCookieSecure())
                .sameSite("Strict")
                .path(path)
                .maxAge(maxAge)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }
}
