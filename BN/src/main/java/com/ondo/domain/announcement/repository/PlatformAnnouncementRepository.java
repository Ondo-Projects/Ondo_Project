package com.ondo.domain.announcement.repository;

import com.ondo.domain.announcement.entity.AnnouncementAudience;
import com.ondo.domain.announcement.entity.PlatformAnnouncement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface PlatformAnnouncementRepository extends JpaRepository<PlatformAnnouncement, Long> {

    List<PlatformAnnouncement> findAllByOrderByCreatedAtDesc();

    List<PlatformAnnouncement> findByAudienceInOrderByCreatedAtDesc(Collection<AnnouncementAudience> audiences);
}
