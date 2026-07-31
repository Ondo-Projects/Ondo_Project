package com.ondo.domain.user.dto;

import com.ondo.domain.user.entity.Role;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public class SignUpResponseDTO {

    private final String username;
    private final String role;
    private final String message;

    public static SignUpResponseDTO of(String username, Role role) {
        return new SignUpResponseDTO(username, role.name(), "회원가입이 완료되었습니다.");
    }
}
