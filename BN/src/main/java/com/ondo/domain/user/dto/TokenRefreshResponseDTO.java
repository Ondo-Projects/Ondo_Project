package com.ondo.domain.user.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class TokenRefreshResponseDTO {

    private String accessToken;
    private String refreshToken;
    private String tokenType;

    public static TokenRefreshResponseDTO of(String accessToken, String refreshToken) {
        return new TokenRefreshResponseDTO(accessToken, refreshToken, "Bearer");
    }
}
