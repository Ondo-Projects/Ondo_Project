package com.ondo.domain.assignment.dto;

import com.ondo.domain.counseling.entity.StudentTeacherAssignment;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class AssignmentResponseDTO {

    private final String teacherUsername;
    private final String teacherName;
    private final String schoolName;
    private final LocalDateTime assignedAt;

    public AssignmentResponseDTO(StudentTeacherAssignment assignment) {
        this.teacherUsername = assignment.getTeacher().getUsername();
        this.teacherName = resolveTeacherName(assignment.getTeacher().getName(), this.teacherUsername);
        this.schoolName = assignment.getTeacher().getSchool().getSchoolName();
        this.assignedAt = assignment.getAssignedAt();
    }

    private static String resolveTeacherName(String name, String username) {
        if (name != null && !name.isBlank()) {
            return name.trim();
        }
        return username;
    }
}
