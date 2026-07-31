package com.ondo.domain.announcement.dto;

import com.ondo.domain.announcement.entity.AnnouncementAudience;
import com.ondo.domain.announcement.entity.AnnouncementStatus;
import com.ondo.domain.announcement.entity.PlatformAnnouncement;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class AnnouncementSummaryDTO {

    private static final int PREVIEW_MAX_LENGTH = 120;

    private final Long id;
    private final String title;
    private final String contentPreview;
    private final AnnouncementAudience audience;
    private final String adminUsername;
    private final String adminName;
    private final boolean pinned;
    private final AnnouncementStatus status;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;

    public AnnouncementSummaryDTO(PlatformAnnouncement announcement) {
        this.id = announcement.getId();
        this.title = announcement.getTitle();
        this.contentPreview = toPreview(announcement.getContent());
        this.audience = announcement.getAudience();
        this.adminUsername = announcement.getAdmin().getUsername();
        this.adminName = announcement.getAdmin().getName();
        this.pinned = announcement.isPinned();
        this.status = announcement.getStatus();
        this.createdAt = announcement.getCreatedAt();
        this.updatedAt = announcement.getUpdatedAt();
    }

    public static String toPreview(String content) {
        if (content == null || content.isBlank()) {
            return "";
        }
        String normalized = content.replaceAll("\\s+", " ").trim();
        if (normalized.length() <= PREVIEW_MAX_LENGTH) {
            return normalized;
        }
        return normalized.substring(0, PREVIEW_MAX_LENGTH) + "…";
    }
}
