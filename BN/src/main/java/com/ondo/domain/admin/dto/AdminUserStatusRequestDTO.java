package com.ondo.domain.admin.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminUserStatusRequestDTO {

    @NotNull(message = "활성 상태를 입력해 주세요.")
    private Boolean active;
}
