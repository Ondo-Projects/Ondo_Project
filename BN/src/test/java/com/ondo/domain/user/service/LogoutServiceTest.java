package com.ondo.domain.user.service;

import com.ondo.global.security.TokenCookieService;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LogoutServiceTest {

    @Mock
    private RefreshTokenService refreshTokenService;

    @Mock
    private TokenCookieService tokenCookieService;

    @Mock
    private AccessTokenBlacklistService accessTokenBlacklistService;

    @InjectMocks
    private LogoutService logoutService;

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void logout_revokesRefreshTokenFromBodyAndClearsCookies() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        when(tokenCookieService.resolveAccessTokenFromRequest(request)).thenReturn("access-token");

        logoutService.logout(request, response, "refresh-token-from-body");

        verify(refreshTokenService).revoke("refresh-token-from-body");
        verify(accessTokenBlacklistService).blacklist("access-token");
        verify(tokenCookieService).clearTokens(response);
        verify(tokenCookieService, never()).resolveRefreshToken(request);
    }

    @Test
    void logout_revokesRefreshTokenFromCookieWhenBodyMissing() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setCookies(new Cookie("refreshToken", "refresh-token-from-cookie"));
        MockHttpServletResponse response = new MockHttpServletResponse();

        when(tokenCookieService.resolveRefreshToken(request)).thenReturn("refresh-token-from-cookie");
        when(tokenCookieService.resolveAccessTokenFromRequest(request)).thenReturn("access-token");

        logoutService.logout(request, response, null);

        verify(refreshTokenService).revoke("refresh-token-from-cookie");
        verify(accessTokenBlacklistService).blacklist("access-token");
        verify(tokenCookieService).clearTokens(response);
    }

    @Test
    void logout_clearsCookiesEvenWhenRefreshTokenMissing() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        when(tokenCookieService.resolveRefreshToken(request)).thenReturn(null);
        when(tokenCookieService.resolveAccessTokenFromRequest(request)).thenReturn(null);

        logoutService.logout(request, response, null);

        verify(refreshTokenService, never()).revoke(org.mockito.ArgumentMatchers.anyString());
        verify(accessTokenBlacklistService, never()).blacklist(org.mockito.ArgumentMatchers.anyString());
        verify(tokenCookieService).clearTokens(response);
    }
}
