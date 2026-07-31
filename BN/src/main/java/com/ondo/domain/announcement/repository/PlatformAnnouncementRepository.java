package com.ondo.domain.announcement.repository;

import com.ondo.domain.announcement.entity.AnnouncementAudience;
import com.ondo.domain.announcement.entity.AnnouncementStatus;
import com.ondo.domain.announcement.entity.PlatformAnnouncement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;

public interface PlatformAnnouncementRepository extends JpaRepository<PlatformAnnouncement, Long> {

    Page<PlatformAnnouncement> findByAudienceInAndStatus(
            Collection<AnnouncementAudience> audiences,
            AnnouncementStatus status,
            Pageable pageable
    );

    Page<PlatformAnnouncement> findAll(Pageable pageable);
}
