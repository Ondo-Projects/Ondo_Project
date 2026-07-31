package com.ondo.domain.user.service;

import com.ondo.global.config.JwtProperties;
import com.ondo.global.error.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.Duration;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private static final String REFRESH_TOKEN_PREFIX = "refresh:token:";

    private final StringRedisTemplate redisTemplate;
    private final JwtProperties jwtProperties;

    public String issueRefreshToken(String username) {
        String refreshToken = UUID.randomUUID().toString();
        redisTemplate.opsForValue().set(
                REFRESH_TOKEN_PREFIX + refreshToken,
                username,
                Duration.ofMillis(jwtProperties.getRefreshTokenExpiration())
        );
        return refreshToken;
    }

    public String validateAndGetUsername(String refreshToken) {
        if (!StringUtils.hasText(refreshToken)) {
            throw new BusinessException("Refresh Token이 제공되지 않았습니다.");
        }

        String username = redisTemplate.opsForValue().get(REFRESH_TOKEN_PREFIX + refreshToken);
        if (!StringUtils.hasText(username)) {
            throw new BusinessException("유효하지 않은 Refresh Token입니다.");
        }

        return username;
    }

    public void revoke(String refreshToken) {
        if (!StringUtils.hasText(refreshToken)) {
            return;
        }
        redisTemplate.delete(REFRESH_TOKEN_PREFIX + refreshToken);
    }
}
