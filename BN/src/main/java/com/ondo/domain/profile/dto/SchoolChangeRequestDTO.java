package com.ondo.domain.profile.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SchoolChangeRequestDTO {

    @NotBlank(message = "변경할 학교를 선택해 주세요.")
    private String schoolCode;
}
