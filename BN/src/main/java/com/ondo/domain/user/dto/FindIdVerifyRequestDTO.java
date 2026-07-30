package com.ondo.domain.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class FindIdVerifyRequestDTO {

    @NotBlank(message = "성명을 입력해 주세요.")
    private String name;

    @NotBlank(message = "이메일을 입력해 주세요.")
    @Email(message = "올바른 이메일 형식을 입력해 주세요.")
    private String email;

    @NotNull(message = "생년월일을 입력해 주세요.")
    private LocalDate birthDate;

    @NotBlank(message = "인증번호를 입력해 주세요.")
    @Pattern(regexp = "^\\d{6}$", message = "인증번호 6자리를 입력해 주세요.")
    private String code;
}
