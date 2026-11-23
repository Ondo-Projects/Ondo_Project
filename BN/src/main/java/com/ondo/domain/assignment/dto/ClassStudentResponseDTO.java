package com.ondo.domain.assignment.dto;

import com.ondo.domain.counseling.entity.StudentTeacherAssignment;
import com.ondo.domain.user.entity.User;
import lombok.Getter;

import java.time.LocalDateTime;

/** 담임과 연결된 학생 한 명 (교사 설정 화면의 '우리 반 학생') */
@Getter
public class ClassStudentResponseDTO {

    private final String studentUsername;
    private final String studentName;
    private final Integer grade;
    private final Integer classNumber;
    private final LocalDateTime assignedAt;

    public ClassStudentResponseDTO(StudentTeacherAssignment assignment) {
        User student = assignment.getStudent();
        this.studentUsername = student.getUsername();
        this.studentName = student.getName();
        this.grade = student.getGrade();
        this.classNumber = student.getClassNumber();
        this.assignedAt = assignment.getAssignedAt();
    }
}
