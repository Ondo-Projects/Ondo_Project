package com.ondo.domain.counseling.controller;

import com.ondo.domain.counseling.dto.CounselingCreateDTO;
import com.ondo.domain.counseling.dto.CounselingReplyDTO;
import com.ondo.domain.counseling.dto.CounselingResponseDTO;
import com.ondo.domain.counseling.dto.CounselingStatusUpdateDTO;
import com.ondo.domain.counseling.dto.CounselingUpdateDTO;
import com.ondo.domain.counseling.entity.CounselingStatus;
import com.ondo.domain.counseling.service.CounselingService;
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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/counseling")
@RequiredArgsConstructor
public class CounselingController {

    private final CounselingService counselingService;

    @PostMapping
    public ResponseEntity<CounselingResponseDTO> create(
            Authentication authentication,
            @Valid @RequestBody CounselingCreateDTO request
    ) {
        CounselingResponseDTO response = counselingService.create(authentication.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/my")
    public ResponseEntity<List<CounselingResponseDTO>> getMyPosts(Authentication authentication) {
        return ResponseEntity.ok(counselingService.getMyPosts(authentication.getName()));
    }

    @GetMapping("/teacher")
    public ResponseEntity<List<CounselingResponseDTO>> getTeacherPosts(
            Authentication authentication,
            @RequestParam(required = false) CounselingStatus status
    ) {
        return ResponseEntity.ok(counselingService.getTeacherPosts(authentication.getName(), status));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(Authentication authentication) {
        long count = counselingService.getTeacherUnreadCount(authentication.getName());
        return ResponseEntity.ok(Map.of("count", count));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CounselingResponseDTO> getPost(
            Authentication authentication,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(counselingService.getPost(authentication.getName(), id));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<CounselingResponseDTO> updateStatus(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody CounselingStatusUpdateDTO request
    ) {
        return ResponseEntity.ok(counselingService.updateStatus(authentication.getName(), id, request));
    }

    @PostMapping("/{id}/reply")
    public ResponseEntity<CounselingResponseDTO> reply(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody CounselingReplyDTO request
    ) {
        return ResponseEntity.ok(counselingService.reply(authentication.getName(), id, request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CounselingResponseDTO> update(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody CounselingUpdateDTO request
    ) {
        return ResponseEntity.ok(counselingService.update(authentication.getName(), id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> delete(
            Authentication authentication,
            @PathVariable Long id
    ) {
        counselingService.delete(authentication.getName(), id);
        return ResponseEntity.ok(Map.of("message", "상담 사전 정보가 삭제되었습니다."));
    }
}
