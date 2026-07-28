package com.ondo.domain.admin.dto;

import com.ondo.domain.school.entity.School;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public class AdminSchoolSummaryDTO {

    private final String schoolCode;
    private final String schoolName;
    private final String region;
    private final String schoolType;
    private final boolean neisMapped;
    private final String neisOfficeCode;
    private final String neisSchoolCode;

    public static AdminSchoolSummaryDTO from(School school) {
        return new AdminSchoolSummaryDTO(
                school.getSchoolCode(),
                school.getSchoolName(),
                school.getRegion(),
                school.getSchoolType(),
                school.hasNeisCodes(),
                school.getNeisOfficeCode(),
                school.getNeisSchoolCode()
        );
    }
}
