package com.ondo.domain.user.service;

import com.ondo.global.util.JwtProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.Duration;
import java.util.Date;

@Service
@RequiredArgsConstructor
public class AccessTokenBlacklistService {

    private static final String BLACKLIST_PREFIX = "logout:access:";

    private final StringRedisTemplate redisTemplate;
    private final JwtProvider jwtProvider;

    public void blacklist(String accessToken) {
        if (!StringUtils.hasText(accessToken) || !jwtProvider.validateToken(accessToken)) {
            return;
        }

        String jti = jwtProvider.getJti(accessToken);
        if (!StringUtils.hasText(jti)) {
            return;
        }

        Date expiration = jwtProvider.getClaims(accessToken).getExpiration();
        long ttlMs = expiration.getTime() - System.currentTimeMillis();
        if (ttlMs <= 0) {
            return;
        }

        redisTemplate.opsForValue().set(
                BLACKLIST_PREFIX + jti,
                "1",
                Duration.ofMillis(ttlMs)
        );
    }

    public boolean isBlacklisted(String accessToken) {
        if (!StringUtils.hasText(accessToken) || !jwtProvider.validateToken(accessToken)) {
            return false;
        }

        String jti = jwtProvider.getJti(accessToken);
        if (!StringUtils.hasText(jti)) {
            return false;
        }

        return Boolean.TRUE.equals(redisTemplate.hasKey(BLACKLIST_PREFIX + jti));
    }
}
