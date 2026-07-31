package com.ondo.domain.notice.controller;

import com.ondo.domain.notice.dto.NoticeCreateDTO;
import com.ondo.domain.notice.dto.NoticeResponseDTO;
import com.ondo.domain.notice.service.NoticeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class NoticeController {

    private final NoticeService noticeService;

    @PostMapping("/api/teacher/notices")
    public ResponseEntity<NoticeResponseDTO> createNotice(
            Authentication authentication,
            @Valid @RequestBody NoticeCreateDTO request
    ) {
        NoticeResponseDTO response = noticeService.createNotice(authentication.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/api/teacher/notices")
    public ResponseEntity<List<NoticeResponseDTO>> getTeacherNotices(Authentication authentication) {
        return ResponseEntity.ok(noticeService.getTeacherNotices(authentication.getName()));
    }

    @DeleteMapping("/api/teacher/notices/{id}")
    public ResponseEntity<Map<String, String>> deleteNotice(
            Authentication authentication,
            @PathVariable Long id
    ) {
        noticeService.deleteNotice(authentication.getName(), id);
        return ResponseEntity.ok(Map.of("message", "알림이 삭제되었습니다."));
    }

    @GetMapping("/api/student/notices")
    public ResponseEntity<List<NoticeResponseDTO>> getStudentNotices(Authentication authentication) {
        return ResponseEntity.ok(noticeService.getStudentNotices(authentication.getName()));
    }
}
