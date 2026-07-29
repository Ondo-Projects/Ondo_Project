package com.ondo.domain.profile.dto;

import com.ondo.domain.user.entity.User;
import lombok.Getter;

@Getter
public class StudentClassProfileResponseDTO {

    private final Integer grade;
    private final Integer classNumber;
    private final boolean completed;
    private final String message;

    public StudentClassProfileResponseDTO(Integer grade, Integer classNumber, boolean completed, String message) {
        this.grade = grade;
        this.classNumber = classNumber;
        this.completed = completed;
        this.message = message;
    }

    public static StudentClassProfileResponseDTO from(User student, String message) {
        Integer grade = student.getGrade();
        Integer classNumber = student.getClassNumber();
        boolean completed = grade != null && classNumber != null;
        return new StudentClassProfileResponseDTO(grade, classNumber, completed, message);
    }
}
