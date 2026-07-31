package com.ondo.domain.counseling.entity;

import com.ondo.domain.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "student_teacher_assignments",
        uniqueConstraints = @UniqueConstraint(columnNames = "student_username")
)
@Getter
@NoArgsConstructor
public class StudentTeacherAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_username", nullable = false)
    private User teacher;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_username", nullable = false)
    private User student;

    @Column(nullable = false)
    private LocalDateTime assignedAt;

    @Builder
    public StudentTeacherAssignment(User teacher, User student, LocalDateTime assignedAt) {
        this.teacher = teacher;
        this.student = student;
        this.assignedAt = assignedAt;
    }
}
