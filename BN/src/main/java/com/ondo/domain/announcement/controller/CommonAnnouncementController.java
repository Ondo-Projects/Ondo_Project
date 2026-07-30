package com.ondo.domain.announcement.controller;

import com.ondo.domain.announcement.dto.AnnouncementResponseDTO;
import com.ondo.domain.announcement.service.AnnouncementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/common/announcements")
@RequiredArgsConstructor
public class CommonAnnouncementController {

    private final AnnouncementService announcementService;

    @GetMapping
    public ResponseEntity<List<AnnouncementResponseDTO>> getAnnouncements(Authentication authentication) {
        return ResponseEntity.ok(announcementService.getCommonAnnouncements(authentication.getName()));
    }
}
