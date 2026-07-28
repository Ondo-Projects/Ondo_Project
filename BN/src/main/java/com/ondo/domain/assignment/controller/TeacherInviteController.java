package com.ondo.domain.assignment.controller;

import com.ondo.domain.assignment.dto.InviteCodeResponseDTO;
import com.ondo.domain.assignment.service.AssignmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/teacher/invite-code")
@RequiredArgsConstructor
public class TeacherInviteController {

    private final AssignmentService assignmentService;

    @GetMapping
    public ResponseEntity<InviteCodeResponseDTO> getInviteCode(Authentication authentication) {
        return ResponseEntity.ok(assignmentService.getOrCreateInviteCode(authentication.getName()));
    }

    @PostMapping("/regenerate")
    public ResponseEntity<InviteCodeResponseDTO> regenerateInviteCode(Authentication authentication) {
        return ResponseEntity.ok(assignmentService.regenerateInviteCode(authentication.getName()));
    }
}
