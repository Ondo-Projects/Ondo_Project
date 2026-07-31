package com.ondo.domain.announcement.entity;

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

import java.time.LocalDateTime;

@Entity
@Table(name = "platform_announcements")
@Getter
@NoArgsConstructor
public class PlatformAnnouncement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AnnouncementAudience audience;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admin_username", nullable = false)
    private User admin;

    @Column(nullable = false)
    private boolean pinned;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AnnouncementStatus status;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @Builder
    public PlatformAnnouncement(
            String title,
            String content,
            AnnouncementAudience audience,
            User admin,
            boolean pinned,
            AnnouncementStatus status,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {
        this.title = title;
        this.content = content;
        this.audience = audience;
        this.admin = admin;
        this.pinned = pinned;
        this.status = status != null ? status : AnnouncementStatus.PUBLISHED;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt != null ? updatedAt : createdAt;
    }

    public void update(
            String title,
            String content,
            AnnouncementAudience audience,
            Boolean pinned,
            AnnouncementStatus status
    ) {
        if (title != null) {
            this.title = title.trim();
        }
        if (content != null) {
            this.content = content.trim();
        }
        if (audience != null) {
            this.audience = audience;
        }
        if (pinned != null) {
            this.pinned = pinned;
        }
        if (status != null) {
            this.status = status;
        }
        this.updatedAt = LocalDateTime.now();
    }
}
