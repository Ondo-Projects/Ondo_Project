package com.ondo.domain.suggestion.controller;

import com.ondo.domain.admin.dto.AdminPageResponseDTO;
import com.ondo.domain.suggestion.dto.AdminSuggestionSummaryDTO;
import com.ondo.domain.suggestion.dto.SuggestionReplyDTO;
import com.ondo.domain.suggestion.dto.SuggestionResponseDTO;
import com.ondo.domain.suggestion.dto.SuggestionStatusUpdateDTO;
import com.ondo.domain.suggestion.service.SuggestionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/suggestions")
@RequiredArgsConstructor
public class AdminSuggestionController {

    private final SuggestionService suggestionService;

    @GetMapping
    public ResponseEntity<AdminPageResponseDTO<AdminSuggestionSummaryDTO>> search(
            Authentication authentication,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(suggestionService.searchForAdmin(
                authentication.getName(),
                status,
                category,
                role,
                keyword,
                page,
                size
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SuggestionResponseDTO> getPost(
            Authentication authentication,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(suggestionService.getPostForAdmin(authentication.getName(), id));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<SuggestionResponseDTO> updateStatus(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody SuggestionStatusUpdateDTO request
    ) {
        return ResponseEntity.ok(suggestionService.updateStatus(authentication.getName(), id, request));
    }

    @PostMapping("/{id}/reply")
    public ResponseEntity<SuggestionResponseDTO> reply(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody SuggestionReplyDTO request
    ) {
        return ResponseEntity.ok(suggestionService.reply(authentication.getName(), id, request));
    }
}
