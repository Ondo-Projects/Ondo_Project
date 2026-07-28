package com.ondo.domain.admin.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminUserSchoolChangeRequestDTO {

    @NotBlank(message = "학교 코드를 입력해 주세요.")
    private String schoolCode;
}
