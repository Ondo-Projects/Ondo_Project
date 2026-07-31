package com.ondo.domain.user.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class LoginResponseDTO {

    private String accessToken;
    private String refreshToken;
    private String tokenType;
    private String username;
    private String role;

    public static LoginResponseDTO of(String accessToken, String refreshToken, String username, String role) {
        return new LoginResponseDTO(accessToken, refreshToken, "Bearer", username, role);
    }
}
