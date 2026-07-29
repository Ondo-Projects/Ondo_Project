package com.ondo.domain.suggestion.controller;

import com.ondo.domain.suggestion.dto.SuggestionCreateDTO;
import com.ondo.domain.suggestion.dto.SuggestionResponseDTO;
import com.ondo.domain.suggestion.dto.SuggestionUpdateDTO;
import com.ondo.domain.suggestion.service.SuggestionService;
import com.ondo.domain.user.entity.Role;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/teacher/suggestions")
@RequiredArgsConstructor
public class TeacherSuggestionController {

    private final SuggestionService suggestionService;

    @PostMapping
    public ResponseEntity<SuggestionResponseDTO> create(
            Authentication authentication,
            @Valid @RequestBody SuggestionCreateDTO request
    ) {
        SuggestionResponseDTO response = suggestionService.create(
                authentication.getName(),
                Role.TEACHER,
                request
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<SuggestionResponseDTO>> getMyPosts(Authentication authentication) {
        return ResponseEntity.ok(suggestionService.getMyPosts(authentication.getName(), Role.TEACHER));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SuggestionResponseDTO> getPost(
            Authentication authentication,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(suggestionService.getPost(authentication.getName(), Role.TEACHER, id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SuggestionResponseDTO> update(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody SuggestionUpdateDTO request
    ) {
        return ResponseEntity.ok(suggestionService.update(
                authentication.getName(),
                Role.TEACHER,
                id,
                request
        ));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> delete(
            Authentication authentication,
            @PathVariable Long id
    ) {
        suggestionService.delete(authentication.getName(), Role.TEACHER, id);
        return ResponseEntity.ok(Map.of("message", "건의 글이 삭제되었습니다."));
    }
}
