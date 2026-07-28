package com.ondo.domain.meal.dto;

import lombok.Getter;

@Getter
public class NeisSchoolCodeDTO {

    private final String officeCode;
    private final String schoolCode;

    public NeisSchoolCodeDTO(String officeCode, String schoolCode) {
        this.officeCode = officeCode;
        this.schoolCode = schoolCode;
    }
}
