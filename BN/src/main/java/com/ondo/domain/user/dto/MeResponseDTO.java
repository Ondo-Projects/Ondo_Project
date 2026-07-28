package com.ondo.domain.user.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;

@Getter
@AllArgsConstructor
public class MeResponseDTO {

    private String username;
    private String role;

    public static MeResponseDTO from(Authentication authentication) {
        String role = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(authority -> authority.startsWith("ROLE_"))
                .map(authority -> authority.substring("ROLE_".length()))
                .findFirst()
                .orElse("");

        return new MeResponseDTO(authentication.getName(), role);
    }
}
