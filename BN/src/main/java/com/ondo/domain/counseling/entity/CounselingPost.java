package com.ondo.domain.counseling.entity;

import com.ondo.domain.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "counseling_posts")
@Getter
@NoArgsConstructor
public class CounselingPost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_username", nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_username", nullable = false)
    private User teacher;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(nullable = false)
    private LocalDate desiredDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CounselingType counselingType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CounselingStatus status;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @Column
    private LocalDateTime deletedAt;

    @Column
    private LocalDateTime readByTeacherAt;

    @Column(columnDefinition = "TEXT")
    private String teacherReply;

    @Column
    private LocalDateTime repliedAt;

    @Builder
    public CounselingPost(
            User student,
            User teacher,
            String title,
            String content,
            LocalDate desiredDate,
            CounselingType counselingType,
            CounselingStatus status,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {
        this.student = student;
        this.teacher = teacher;
        this.title = title;
        this.content = content;
        this.desiredDate = desiredDate;
        this.counselingType = counselingType;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public void update(String title, String content, LocalDate desiredDate, CounselingType counselingType) {
        this.title = title;
        this.content = content;
        this.desiredDate = desiredDate;
        this.counselingType = counselingType;
        this.updatedAt = LocalDateTime.now();
    }

    public void softDelete() {
        this.deletedAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public boolean isOwnedBy(User user) {
        return student.getUsername().equals(user.getUsername());
    }

    public boolean isAssignedTo(User teacher) {
        return this.teacher.getUsername().equals(teacher.getUsername());
    }

    public boolean isDeleted() {
        return deletedAt != null;
    }

    public boolean isEditable() {
        return status == CounselingStatus.WAITING;
    }

    public boolean canTransitionTo(CounselingStatus newStatus) {
        if (newStatus == status) {
            return false;
        }
        return switch (status) {
            case WAITING -> newStatus == CounselingStatus.CONFIRMED || newStatus == CounselingStatus.CANCELLED;
            case CONFIRMED -> newStatus == CounselingStatus.COMPLETED || newStatus == CounselingStatus.CANCELLED;
            case COMPLETED, CANCELLED -> false;
        };
    }

    public void changeStatus(CounselingStatus newStatus) {
        this.status = newStatus;
        this.updatedAt = LocalDateTime.now();
    }

    public void markAsReadByTeacher() {
        if (readByTeacherAt == null) {
            this.readByTeacherAt = LocalDateTime.now();
            this.updatedAt = LocalDateTime.now();
        }
    }

    public void reply(String reply) {
        this.teacherReply = reply;
        this.repliedAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public boolean isReplyable() {
        return status != CounselingStatus.CANCELLED;
    }
}
