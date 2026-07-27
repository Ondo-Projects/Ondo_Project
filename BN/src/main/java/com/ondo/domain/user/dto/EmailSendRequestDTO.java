package com.ondo.domain.user.dto;

import com.ondo.domain.user.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EmailSendRequestDTO {

    @NotBlank
    @Email
    private String email;

    @NotNull
    private Role role;
}
