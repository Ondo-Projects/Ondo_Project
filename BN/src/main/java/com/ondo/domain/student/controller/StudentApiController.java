package com.ondo.domain.student.controller;

import com.ondo.domain.home.dto.StudentHomeAggregateResponseDTO;
import com.ondo.domain.home.service.StudentHomeAggregateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/student")
@RequiredArgsConstructor
public class StudentApiController {

    private final StudentHomeAggregateService studentHomeAggregateService;

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("message", "student ok"));
    }

    @GetMapping("/home")
    public ResponseEntity<StudentHomeAggregateResponseDTO> getHome(Authentication authentication) {
        return ResponseEntity.ok(studentHomeAggregateService.loadHome(authentication.getName()));
    }
}
