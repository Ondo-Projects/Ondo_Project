package com.ondo.domain.user.service;

import com.ondo.global.config.JwtProperties;
import com.ondo.global.error.BusinessException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RefreshTokenServiceTest {

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    private RefreshTokenService refreshTokenService;

    @BeforeEach
    void setUp() {
        JwtProperties properties = new JwtProperties();
        properties.setRefreshTokenExpiration(604_800_000L);
        refreshTokenService = new RefreshTokenService(redisTemplate, properties);
    }

    @Test
    void issueRefreshToken_storesTokenInRedis() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);

        String refreshToken = refreshTokenService.issueRefreshToken("student01");

        assertThat(refreshToken).isNotBlank();

        ArgumentCaptor<String> keyCaptor = ArgumentCaptor.forClass(String.class);
        verify(valueOperations).set(keyCaptor.capture(), eq("student01"), eq(Duration.ofMillis(604_800_000L)));
        assertThat(keyCaptor.getValue()).startsWith("refresh:token:");
    }

    @Test
    void validateAndGetUsername_returnsUsernameWhenTokenExists() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get("refresh:token:valid-token")).thenReturn("student01");

        String username = refreshTokenService.validateAndGetUsername("valid-token");

        assertThat(username).isEqualTo("student01");
    }

    @Test
    void validateAndGetUsername_throwsWhenTokenMissing() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get(anyString())).thenReturn(null);

        assertThatThrownBy(() -> refreshTokenService.validateAndGetUsername("missing-token"))
                .isInstanceOf(BusinessException.class)
                .hasMessage("유효하지 않은 Refresh Token입니다.");
    }

    @Test
    void revoke_deletesTokenFromRedis() {
        refreshTokenService.revoke("refresh-token");

        verify(redisTemplate).delete("refresh:token:refresh-token");
    }
}
