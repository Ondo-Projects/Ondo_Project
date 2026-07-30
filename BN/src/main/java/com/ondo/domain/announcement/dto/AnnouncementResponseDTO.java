package com.ondo.domain.announcement.dto;

import com.ondo.domain.announcement.entity.AnnouncementAudience;
import com.ondo.domain.announcement.entity.PlatformAnnouncement;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class AnnouncementResponseDTO {

    private final Long id;
    private final String title;
    private final String content;
    private final AnnouncementAudience audience;
    private final String adminUsername;
    private final String adminName;
    private final LocalDateTime createdAt;

    public AnnouncementResponseDTO(PlatformAnnouncement announcement) {
        this.id = announcement.getId();
        this.title = announcement.getTitle();
        this.content = announcement.getContent();
        this.audience = announcement.getAudience();
        this.adminUsername = announcement.getAdmin().getUsername();
        this.adminName = announcement.getAdmin().getName();
        this.createdAt = announcement.getCreatedAt();
    }
}
