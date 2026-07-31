package com.ondo.domain.announcement.controller;

import com.ondo.domain.announcement.dto.AnnouncementCreateDTO;
import com.ondo.domain.announcement.dto.AnnouncementPageResponseDTO;
import com.ondo.domain.announcement.dto.AnnouncementResponseDTO;
import com.ondo.domain.announcement.dto.AnnouncementUpdateDTO;
import com.ondo.domain.announcement.service.AnnouncementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/announcements")
@RequiredArgsConstructor
public class AdminAnnouncementController {

    private final AnnouncementService announcementService;

    @PostMapping
    public ResponseEntity<AnnouncementResponseDTO> createAnnouncement(
            Authentication authentication,
            @Valid @RequestBody AnnouncementCreateDTO request
    ) {
        AnnouncementResponseDTO response = announcementService.createAnnouncement(
                authentication.getName(),
                request
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<AnnouncementPageResponseDTO> getAnnouncements(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(announcementService.getAdminAnnouncements(
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
        return ResponseEntity.ok(announcementService.getAdminAnnouncement(
                authentication.getName(),
                id
        ));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<AnnouncementResponseDTO> updateAnnouncement(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody AnnouncementUpdateDTO request
    ) {
        return ResponseEntity.ok(announcementService.updateAnnouncement(
                authentication.getName(),
                id,
                request
        ));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteAnnouncement(
            Authentication authentication,
            @PathVariable Long id
    ) {
        announcementService.deleteAnnouncement(authentication.getName(), id);
        return ResponseEntity.ok(Map.of("message", "공지가 삭제되었습니다."));
    }
}
