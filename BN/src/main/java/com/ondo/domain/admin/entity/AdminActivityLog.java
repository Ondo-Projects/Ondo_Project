package com.ondo.domain.admin.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "admin_activity_logs")
@Getter
@NoArgsConstructor
public class AdminActivityLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String adminUsername;

    @Column(nullable = false, length = 50)
    private String action;

    @Column(length = 50)
    private String targetUsername;

    @Column(length = 255)
    private String detail;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Builder
    public AdminActivityLog(
            String adminUsername,
            String action,
            String targetUsername,
            String detail,
            LocalDateTime createdAt
    ) {
        this.adminUsername = adminUsername;
        this.action = action;
        this.targetUsername = targetUsername;
        this.detail = detail;
        this.createdAt = createdAt;
    }
}
