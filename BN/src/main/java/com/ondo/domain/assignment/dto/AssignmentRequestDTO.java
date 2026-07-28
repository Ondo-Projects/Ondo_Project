package com.ondo.domain.assignment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AssignmentRequestDTO {

    @NotBlank(message = "초대 코드를 입력해 주세요.")
    @Pattern(regexp = "\\d{6}", message = "초대 코드는 6자리 숫자여야 합니다.")
    private String inviteCode;
}
