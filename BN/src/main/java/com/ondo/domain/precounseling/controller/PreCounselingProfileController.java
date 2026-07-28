package com.ondo.domain.precounseling.controller;

import com.ondo.domain.precounseling.dto.PreCounselingProfileResponseDTO;
import com.ondo.domain.precounseling.dto.PreCounselingProfileSaveRequestDTO;
import com.ondo.domain.precounseling.dto.PreCounselingProfileSummaryDTO;
import com.ondo.domain.precounseling.service.PreCounselingProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class PreCounselingProfileController {

    private final PreCounselingProfileService preCounselingProfileService;

    @GetMapping("/api/student/pre-counseling-profile")
    public ResponseEntity<PreCounselingProfileResponseDTO> getMyProfile(Authentication authentication) {
        return ResponseEntity.ok(preCounselingProfileService.getMyProfile(authentication.getName()));
    }

    @PutMapping("/api/student/pre-counseling-profile")
    public ResponseEntity<Map<String, Object>> saveMyProfile(
            Authentication authentication,
            @Valid @RequestBody PreCounselingProfileSaveRequestDTO request
    ) {
        PreCounselingProfileResponseDTO saved = preCounselingProfileService.saveMyProfile(
                authentication.getName(),
                request
        );
        return ResponseEntity.ok(Map.of(
                "message", "사전 상담 카드가 저장되었습니다.",
                "profile", saved
        ));
    }

    @GetMapping("/api/teacher/pre-counseling-profiles")
    public ResponseEntity<List<PreCounselingProfileSummaryDTO>> getAssignedSummaries(Authentication authentication) {
        return ResponseEntity.ok(preCounselingProfileService.getAssignedStudentSummaries(authentication.getName()));
    }

    @GetMapping("/api/teacher/pre-counseling-profiles/{studentUsername}")
    public ResponseEntity<PreCounselingProfileResponseDTO> getAssignedStudentProfile(
            Authentication authentication,
            @PathVariable String studentUsername
    ) {
        return ResponseEntity.ok(preCounselingProfileService.getAssignedStudentProfile(
                authentication.getName(),
                studentUsername
        ));
    }
}
