package com.ondo.domain.user.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AccountWithdrawRequestDTO {

    @NotBlank(message = "비밀번호를 입력해 주세요.")
    private String password;

    @AssertTrue(message = "탈퇴 안내에 동의해 주세요.")
    private boolean agreed;

    @Size(max = 50, message = "탈퇴 사유 값이 올바르지 않습니다.")
    private String reason;

    @Size(max = 500, message = "기타 사유는 500자 이내로 입력해 주세요.")
    private String reasonDetail;
}
