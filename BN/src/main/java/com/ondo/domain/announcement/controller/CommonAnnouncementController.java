package com.ondo.domain.announcement.controller;

import com.ondo.domain.announcement.dto.AnnouncementPageResponseDTO;
import com.ondo.domain.announcement.dto.AnnouncementResponseDTO;
import com.ondo.domain.announcement.service.AnnouncementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/common/announcements")
@RequiredArgsConstructor
public class CommonAnnouncementController {

    private final AnnouncementService announcementService;

    @GetMapping
    public ResponseEntity<AnnouncementPageResponseDTO> getAnnouncements(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(announcementService.getCommonAnnouncements(
                authentication.getName(),
                page,
                size
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AnnouncementResponseDTO> getAnnouncement(
            Authentication authentication,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(announcementService.getCommonAnnouncement(
                authentication.getName(),
                id
        ));
    }
}
