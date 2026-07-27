package com.ondo.domain.user.dto;

import com.ondo.domain.user.entity.Role;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserDTO {
    private String username;
    private String password;
    private Role role;
}
