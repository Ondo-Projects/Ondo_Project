package com.ondo.domain.user.service;

import com.ondo.domain.user.entity.Role;
import com.ondo.global.util.JwtProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AccessTokenBlacklistServiceTest {

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @Mock
    private JwtProvider jwtProvider;

    @InjectMocks
    private AccessTokenBlacklistService accessTokenBlacklistService;

    private JwtProvider realJwtProvider;

    @BeforeEach
    void setUp() {
        com.ondo.global.config.JwtProperties properties = new com.ondo.global.config.JwtProperties();
        properties.setSecret("test-secret-key-at-least-32-bytes-long!!");
        properties.setAccessTokenExpiration(60_000L);
        realJwtProvider = new JwtProvider(properties);
    }

    @Test
    void blacklist_storesJtiInRedisUntilTokenExpires() {
        String token = realJwtProvider.createAccessToken("student01", Role.STUDENT);
        when(jwtProvider.validateToken(token)).thenReturn(true);
        when(jwtProvider.getJti(token)).thenReturn(realJwtProvider.getJti(token));
        when(jwtProvider.getClaims(token)).thenReturn(realJwtProvider.getClaims(token));
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);

        accessTokenBlacklistService.blacklist(token);

        ArgumentCaptor<String> keyCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<Duration> durationCaptor = ArgumentCaptor.forClass(Duration.class);
        verify(valueOperations).set(keyCaptor.capture(), eq("1"), durationCaptor.capture());
        assertThat(keyCaptor.getValue()).startsWith("logout:access:");
        assertThat(durationCaptor.getValue().toMillis()).isPositive();
    }

    @Test
    void isBlacklisted_returnsTrueWhenKeyExists() {
        String token = realJwtProvider.createAccessToken("student01", Role.STUDENT);
        when(jwtProvider.validateToken(token)).thenReturn(true);
        when(jwtProvider.getJti(token)).thenReturn(realJwtProvider.getJti(token));
        when(redisTemplate.hasKey("logout:access:" + realJwtProvider.getJti(token))).thenReturn(true);

        assertThat(accessTokenBlacklistService.isBlacklisted(token)).isTrue();
    }
}
