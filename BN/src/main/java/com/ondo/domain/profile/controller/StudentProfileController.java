package com.ondo.domain.profile.controller;

import com.ondo.domain.user.entity.Role;
import com.ondo.domain.profile.dto.ProfileSchoolResponseDTO;
import com.ondo.domain.profile.dto.SchoolChangeRequestDTO;
import com.ondo.domain.profile.service.ProfileSchoolService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/student/profile")
@RequiredArgsConstructor
public class StudentProfileController {

    private final ProfileSchoolService profileSchoolService;

    @GetMapping("/school")
    public ResponseEntity<ProfileSchoolResponseDTO> getMySchool(Authentication authentication) {
        return ResponseEntity.ok(profileSchoolService.getMySchool(
                authentication.getName(),
                Role.STUDENT
        ));
    }

    @PatchMapping("/school")
    public ResponseEntity<ProfileSchoolResponseDTO> changeSchool(
            Authentication authentication,
            @Valid @RequestBody SchoolChangeRequestDTO request
    ) {
        return ResponseEntity.ok(profileSchoolService.changeStudentSchool(authentication.getName(), request));
    }
}
