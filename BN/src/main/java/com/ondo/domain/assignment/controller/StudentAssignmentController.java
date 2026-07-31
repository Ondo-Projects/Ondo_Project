package com.ondo.domain.assignment.controller;

import com.ondo.domain.assignment.dto.AssignmentRequestDTO;
import com.ondo.domain.assignment.dto.AssignmentResponseDTO;
import com.ondo.domain.assignment.service.AssignmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/student/assignment")
@RequiredArgsConstructor
public class StudentAssignmentController {

    private final AssignmentService assignmentService;

    @PostMapping
    public ResponseEntity<AssignmentResponseDTO> registerAssignment(
            Authentication authentication,
            @Valid @RequestBody AssignmentRequestDTO request
    ) {
        AssignmentResponseDTO response = assignmentService.registerAssignment(authentication.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<AssignmentResponseDTO> getMyAssignment(Authentication authentication) {
        return ResponseEntity.ok(assignmentService.getMyAssignment(authentication.getName()));
    }
}
