package com.ondo.domain.teacher.controller;

import com.ondo.domain.home.dto.TeacherHomeAggregateResponseDTO;
import com.ondo.domain.home.service.TeacherHomeAggregateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/teacher")
@RequiredArgsConstructor
public class TeacherApiController {

    private final TeacherHomeAggregateService teacherHomeAggregateService;

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("message", "teacher ok"));
    }

    @GetMapping("/home")
    public ResponseEntity<TeacherHomeAggregateResponseDTO> getHome(Authentication authentication) {
        return ResponseEntity.ok(teacherHomeAggregateService.loadHome(authentication.getName()));
    }
}
