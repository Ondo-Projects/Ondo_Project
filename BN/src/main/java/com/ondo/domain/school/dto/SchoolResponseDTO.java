package com.ondo.domain.school.dto;

import com.ondo.domain.school.entity.School;
import lombok.Getter;

@Getter
public class SchoolResponseDTO {

    private final String schoolCode;
    private final String schoolName;
    private final String region;
    private final String schoolType;

    public SchoolResponseDTO(School school) {
        this.schoolCode = school.getSchoolCode();
        this.schoolName = school.getSchoolName();
        this.region = school.getRegion();
        this.schoolType = school.getSchoolType();
    }
}
