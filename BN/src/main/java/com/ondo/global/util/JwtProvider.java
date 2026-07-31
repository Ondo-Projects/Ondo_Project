package com.ondo.global.util;

import com.ondo.domain.user.entity.Role;
import com.ondo.global.config.JwtProperties;
import com.ondo.global.error.BusinessException;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class JwtProvider {

    private static final String ROLE_CLAIM = "role";

    private final JwtProperties jwtProperties;

    public String createAccessToken(String username, Role role) {
        if (!StringUtils.hasText(username)) {
            throw new BusinessException("토큰 생성에 필요한 사용자 정보가 없습니다.");
        }
        if (role == null) {
            throw new BusinessException("토큰 생성에 필요한 역할 정보가 없습니다.");
        }

        Date now = new Date();
        Date expiration = new Date(now.getTime() + jwtProperties.getAccessTokenExpiration());

        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .subject(username)
                .claim(ROLE_CLAIM, role.name())
                .issuedAt(now)
                .expiration(expiration)
                .signWith(getSigningKey())
                .compact();
    }

    public boolean validateToken(String token) {
        if (!StringUtils.hasText(token)) {
            return false;
        }

        try {
            parseClaims(token);
            return true;
        } catch (ExpiredJwtException e) {
            return false;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public Claims getClaims(String token) {
        if (!StringUtils.hasText(token)) {
            throw new BusinessException("토큰이 제공되지 않았습니다.");
        }

        try {
            return parseClaims(token);
        } catch (ExpiredJwtException e) {
            throw new BusinessException("만료된 토큰입니다.");
        } catch (JwtException | IllegalArgumentException e) {
            throw new BusinessException("유효하지 않은 토큰입니다.");
        }
    }

    public String getUsername(String token) {
        return getClaims(token).getSubject();
    }

    public Role getRole(String token) {
        String roleName = getClaims(token).get(ROLE_CLAIM, String.class);
        if (!StringUtils.hasText(roleName)) {
            throw new BusinessException("토큰에 역할 정보가 없습니다.");
        }

        try {
            return Role.valueOf(roleName);
        } catch (IllegalArgumentException e) {
            throw new BusinessException("토큰의 역할 정보가 올바르지 않습니다.");
        }
    }

    public String getJti(String token) {
        return getClaims(token).getId();
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            throw new BusinessException("JWT secret은 최소 32바이트 이상이어야 합니다.");
        }
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
