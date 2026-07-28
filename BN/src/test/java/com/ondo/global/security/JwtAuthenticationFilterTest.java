package com.ondo.global.security;

import com.ondo.domain.user.entity.Role;
import com.ondo.domain.user.service.AccessTokenBlacklistService;
import com.ondo.global.util.JwtProvider;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    @Mock
    private JwtProvider jwtProvider;

    @Mock
    private TokenCookieService tokenCookieService;

    @Mock
    private AccessTokenBlacklistService accessTokenBlacklistService;

    @Mock
    private FilterChain filterChain;

    @InjectMocks
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    private MockHttpServletRequest request;
    private MockHttpServletResponse response;

    @BeforeEach
    void setUp() {
        request = new MockHttpServletRequest();
        response = new MockHttpServletResponse();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void doFilterInternal_setsAuthenticationWhenTokenIsValid() throws Exception {
        request.addHeader("Authorization", "Bearer valid-token");
        when(tokenCookieService.resolveAccessTokenFromRequest(request)).thenReturn("valid-token");
        when(jwtProvider.validateToken("valid-token")).thenReturn(true);
        when(accessTokenBlacklistService.isBlacklisted("valid-token")).thenReturn(false);
        when(jwtProvider.getUsername("valid-token")).thenReturn("student01");
        when(jwtProvider.getRole("valid-token")).thenReturn(Role.STUDENT);

        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNotNull();
        assertThat(SecurityContextHolder.getContext().getAuthentication().getName()).isEqualTo("student01");
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void doFilterInternal_returnsUnauthorizedWhenTokenIsInvalid() throws Exception {
        request.addHeader("Authorization", "Bearer invalid-token");
        when(tokenCookieService.resolveAccessTokenFromRequest(request)).thenReturn("invalid-token");
        when(tokenCookieService.resolveBearerToken(request)).thenReturn("invalid-token");
        when(jwtProvider.validateToken("invalid-token")).thenReturn(false);

        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        assertThat(response.getStatus()).isEqualTo(401);
        assertThat(response.getContentAsString()).contains("유효하지 않은 토큰입니다.");
        verify(filterChain, never()).doFilter(request, response);
    }

    @Test
    void doFilterInternal_returnsUnauthorizedWhenTokenIsBlacklisted() throws Exception {
        request.addHeader("Authorization", "Bearer blacklisted-token");
        when(tokenCookieService.resolveAccessTokenFromRequest(request)).thenReturn("blacklisted-token");
        when(tokenCookieService.resolveBearerToken(request)).thenReturn("blacklisted-token");
        when(jwtProvider.validateToken("blacklisted-token")).thenReturn(true);
        when(accessTokenBlacklistService.isBlacklisted("blacklisted-token")).thenReturn(true);

        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        assertThat(response.getStatus()).isEqualTo(401);
        verify(filterChain, never()).doFilter(request, response);
    }

    @Test
    void doFilterInternal_continuesWhenAuthorizationHeaderIsMissing() throws Exception {
        when(tokenCookieService.resolveAccessTokenFromRequest(request)).thenReturn(null);

        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
        verify(jwtProvider, never()).validateToken(org.mockito.ArgumentMatchers.anyString());
    }

    @Test
    void doFilterInternal_setsAuthenticationWhenAccessTokenCookieIsValid() throws Exception {
        request.setCookies(new jakarta.servlet.http.Cookie("accessToken", "cookie-token"));
        when(tokenCookieService.resolveAccessTokenFromRequest(request)).thenReturn("cookie-token");
        when(jwtProvider.validateToken("cookie-token")).thenReturn(true);
        when(accessTokenBlacklistService.isBlacklisted("cookie-token")).thenReturn(false);
        when(jwtProvider.getUsername("cookie-token")).thenReturn("student01");
        when(jwtProvider.getRole("cookie-token")).thenReturn(Role.STUDENT);

        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNotNull();
        verify(filterChain).doFilter(request, response);
    }
}
