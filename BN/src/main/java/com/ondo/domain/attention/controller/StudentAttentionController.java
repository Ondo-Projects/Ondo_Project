package com.ondo.domain.attention.controller;

import com.ondo.domain.attention.dto.StudentAttentionResponseDTO;
import com.ondo.domain.attention.service.StudentAttentionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class StudentAttentionController {

    private final StudentAttentionService studentAttentionService;

    /** 담임이 먼저 살펴보면 좋을 학생 (오늘 '힘듦', 최근 기분 저하, 진행 중인 학교폭력 상담) */
    @GetMapping("/api/teacher/attention")
    public ResponseEntity<List<StudentAttentionResponseDTO>> getAttention(Authentication authentication) {
        return ResponseEntity.ok(studentAttentionService.getForTeacher(authentication.getName(), LocalDate.now()));
    }
}
