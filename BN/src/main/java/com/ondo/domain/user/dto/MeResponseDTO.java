package com.ondo.domain.user.dto;

import com.ondo.domain.user.entity.User;
import lombok.Getter;

@Getter
public class MeResponseDTO {

    private final String username;
    private final String role;
    private final String name;
    private final String schoolName;
    private final String schoolRegion;

    public MeResponseDTO(String username, String role, String name, String schoolName, String schoolRegion) {
        this.username = username;
        this.role = role;
        this.name = name;
        this.schoolName = schoolName;
        this.schoolRegion = schoolRegion;
    }

    public static MeResponseDTO from(User user) {
        return new MeResponseDTO(
                user.getUsername(),
                user.getRole().name(),
                user.getName(),
                user.getSchool().getSchoolName(),
                user.getSchool().getRegion()
        );
    }
}
