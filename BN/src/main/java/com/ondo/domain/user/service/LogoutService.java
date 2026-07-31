package com.ondo.domain.user.service;

import com.ondo.global.security.TokenCookieService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class LogoutService {

    private final RefreshTokenService refreshTokenService;
    private final TokenCookieService tokenCookieService;
    private final AccessTokenBlacklistService accessTokenBlacklistService;

    public void logout(HttpServletRequest request, HttpServletResponse response, String refreshTokenFromBody) {
        String refreshToken = refreshTokenFromBody;
        if (!StringUtils.hasText(refreshToken)) {
            refreshToken = tokenCookieService.resolveRefreshToken(request);
        }

        if (StringUtils.hasText(refreshToken)) {
            refreshTokenService.revoke(refreshToken);
        }

        String accessToken = tokenCookieService.resolveAccessTokenFromRequest(request);
        if (StringUtils.hasText(accessToken)) {
            accessTokenBlacklistService.blacklist(accessToken);
        }

        tokenCookieService.clearTokens(response);
        SecurityContextHolder.clearContext();
    }
}
