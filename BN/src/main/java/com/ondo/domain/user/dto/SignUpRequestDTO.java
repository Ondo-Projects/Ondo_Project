package com.ondo.domain.user.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.ondo.domain.user.entity.GuardianRelation;
import com.ondo.domain.user.entity.Role;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

@Getter
@Setter
@ToString(exclude = "password")
public class SignUpRequestDTO {

    @NotNull
    private Role role;

    @NotBlank
    private String schoolCode;

    @Size(max = 50)
    private String name;

    @Past(message = "올바른 생년월일을 입력해 주세요.")
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate birthDate;

    @NotBlank
    @Size(min = 4, max = 50)
    private String username;

    @NotBlank
    @Size(min = 8, max = 100)
    private String password;

    @NotBlank
    private String passwordConfirm;

    @Email
    private String email;

    @Size(max = 50)
    private String guardianName;

    @Size(max = 20)
    private String guardianPhone;

    private GuardianRelation guardianRelation;

    private boolean agreeGuardianChildPrivacy;
    private boolean agreeGuardianChildSensitive;
    private boolean agreeGuardianIdentity;

    @AssertTrue(message = "서비스 이용약관에 동의해야 합니다.")
    private boolean agreeService;

    @AssertTrue(message = "개인정보 수집 및 이용에 동의해야 합니다.")
    private boolean agreePrivacy;

    @AssertTrue(message = "민감정보 관련 필수 약관에 동의해야 합니다.")
    private boolean agreeSensitive;
}
