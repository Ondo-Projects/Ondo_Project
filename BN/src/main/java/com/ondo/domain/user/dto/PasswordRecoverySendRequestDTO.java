package com.ondo.domain.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PasswordRecoverySendRequestDTO {

    @NotBlank(message = "아이디를 입력해 주세요.")
    @Size(min = 4, max = 50, message = "아이디는 4~50자여야 합니다.")
    private String username;

    @NotBlank(message = "이메일을 입력해 주세요.")
    @Email(message = "올바른 이메일 형식을 입력해 주세요.")
    private String email;
}
