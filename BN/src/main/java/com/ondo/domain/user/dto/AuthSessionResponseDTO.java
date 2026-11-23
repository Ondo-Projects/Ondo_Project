package com.ondo.domain.user.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 로그인 응답. 토큰은 httpOnly 쿠키로만 전달하고 본문에는 넣지 않습니다.
 */
@Getter
@AllArgsConstructor
public class AuthSessionResponseDTO {

    private String username;
    private String role;

    public static AuthSessionResponseDTO from(LoginResponseDTO tokens) {
        return new AuthSessionResponseDTO(tokens.getUsername(), tokens.getRole());
    }
}
