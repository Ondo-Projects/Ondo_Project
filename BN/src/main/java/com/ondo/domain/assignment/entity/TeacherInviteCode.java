package com.ondo.domain.assignment.entity;

import com.ondo.domain.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "teacher_invite_codes")
@Getter
@NoArgsConstructor
public class TeacherInviteCode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_username", nullable = false, unique = true)
    private User teacher;

    @Column(nullable = false, unique = true, length = 6)
    private String code;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Builder
    public TeacherInviteCode(User teacher, String code, LocalDateTime createdAt) {
        this.teacher = teacher;
        this.code = code;
        this.createdAt = createdAt;
    }

    public void regenerate(String newCode) {
        this.code = newCode;
        this.createdAt = LocalDateTime.now();
    }
}
