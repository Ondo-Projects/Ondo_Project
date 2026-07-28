package com.ondo.domain.profile.dto;

import com.ondo.domain.school.entity.School;
import lombok.Getter;

@Getter
public class ProfileSchoolResponseDTO {

    private final String schoolCode;
    private final String schoolName;
    private final String region;
    private final String schoolType;
    private final String message;

    public ProfileSchoolResponseDTO(School school, String message) {
        this.schoolCode = school.getSchoolCode();
        this.schoolName = school.getSchoolName();
        this.region = school.getRegion();
        this.schoolType = school.getSchoolType();
        this.message = message;
    }
}
