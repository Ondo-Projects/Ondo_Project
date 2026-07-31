package com.ondo.global.util;

import com.ondo.domain.user.entity.Role;
import com.ondo.global.config.JwtProperties;
import com.ondo.global.error.BusinessException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtProviderTest {

    private JwtProvider jwtProvider;

    @BeforeEach
    void setUp() {
        JwtProperties properties = new JwtProperties();
        properties.setSecret("test-secret-key-at-least-32-bytes-long!!");
        properties.setAccessTokenExpiration(60_000L);
        jwtProvider = new JwtProvider(properties);
    }

    @Test
    void createAccessToken_containsUsernameAndRole() {
        String token = jwtProvider.createAccessToken("student01", Role.STUDENT);

        assertThat(jwtProvider.validateToken(token)).isTrue();
        assertThat(jwtProvider.getUsername(token)).isEqualTo("student01");
        assertThat(jwtProvider.getRole(token)).isEqualTo(Role.STUDENT);
        assertThat(jwtProvider.getJti(token)).isNotBlank();
    }

    @Test
    void validateToken_returnsFalseForBlankToken() {
        assertThat(jwtProvider.validateToken("")).isFalse();
        assertThat(jwtProvider.validateToken("   ")).isFalse();
        assertThat(jwtProvider.validateToken(null)).isFalse();
    }

    @Test
    void validateToken_returnsFalseForTamperedToken() {
        String token = jwtProvider.createAccessToken("teacher01", Role.TEACHER);
        String tamperedToken = token.substring(0, token.length() - 1) + "x";

        assertThat(jwtProvider.validateToken(tamperedToken)).isFalse();
    }

    @Test
    void validateToken_returnsFalseForExpiredToken() {
        JwtProperties properties = new JwtProperties();
        properties.setSecret("test-secret-key-at-least-32-bytes-long!!");
        properties.setAccessTokenExpiration(-1_000L);
        JwtProvider expiredTokenProvider = new JwtProvider(properties);

        String token = expiredTokenProvider.createAccessToken("admin01", Role.ADMIN);

        assertThat(jwtProvider.validateToken(token)).isFalse();
    }

    @Test
    void getClaims_throwsBusinessExceptionForInvalidToken() {
        assertThatThrownBy(() -> jwtProvider.getClaims("invalid.token.value"))
                .isInstanceOf(BusinessException.class)
                .hasMessage("유효하지 않은 토큰입니다.");
    }

    @Test
    void createAccessToken_throwsWhenUsernameMissing() {
        assertThatThrownBy(() -> jwtProvider.createAccessToken("", Role.STUDENT))
                .isInstanceOf(BusinessException.class)
                .hasMessage("토큰 생성에 필요한 사용자 정보가 없습니다.");
    }

    @Test
    void getRole_throwsWhenRoleClaimMissing() {
        String tokenWithoutRole = Jwts.builder()
                .subject("student01")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 60_000L))
                .signWith(Keys.hmacShaKeyFor("test-secret-key-at-least-32-bytes-long!!".getBytes(StandardCharsets.UTF_8)))
                .compact();

        assertThatThrownBy(() -> jwtProvider.getRole(tokenWithoutRole))
                .isInstanceOf(BusinessException.class)
                .hasMessage("토큰에 역할 정보가 없습니다.");
    }
}
