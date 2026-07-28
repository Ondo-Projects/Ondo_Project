package com.ondo.domain.admin.dto;

import com.ondo.domain.user.entity.Role;
import com.ondo.domain.user.entity.User;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public class AdminUserSummaryDTO {

    private final String username;
    private final String name;
    private final Role role;
    private final String schoolCode;
    private final String schoolName;
    private final String schoolRegion;
    private final boolean active;

    public static AdminUserSummaryDTO from(User user) {
        return new AdminUserSummaryDTO(
                user.getUsername(),
                user.getName(),
                user.getRole(),
                user.getSchool().getSchoolCode(),
                user.getSchool().getSchoolName(),
                user.getSchool().getRegion(),
                user.isActive()
        );
    }
}
