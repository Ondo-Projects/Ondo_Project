package com.ondo.domain.user.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GuardianSmsSendRequestDTO {

    @NotBlank
    private String guardianName;

    @NotBlank
    private String studentName;

    @NotBlank
    private String phone;
}
