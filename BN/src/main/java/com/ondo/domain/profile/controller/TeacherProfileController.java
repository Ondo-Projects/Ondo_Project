package com.ondo.domain.profile.controller;

import com.ondo.domain.user.entity.Role;
import com.ondo.domain.profile.dto.ProfileSchoolResponseDTO;
import com.ondo.domain.profile.dto.SchoolChangeRequestDTO;
import com.ondo.domain.profile.dto.TeacherNotificationSettingsResponseDTO;
import com.ondo.domain.profile.dto.TeacherNotificationSettingsUpdateRequestDTO;
import com.ondo.domain.profile.service.ProfileSchoolService;
import com.ondo.domain.profile.service.TeacherNotificationSettingsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/teacher/profile")
@RequiredArgsConstructor
public class TeacherProfileController {

    private final ProfileSchoolService profileSchoolService;
    private final TeacherNotificationSettingsService teacherNotificationSettingsService;

    @GetMapping("/school")
    public ResponseEntity<ProfileSchoolResponseDTO> getMySchool(Authentication authentication) {
        return ResponseEntity.ok(profileSchoolService.getMySchool(
                authentication.getName(),
                Role.TEACHER
        ));
    }

    @PatchMapping("/school")
    public ResponseEntity<ProfileSchoolResponseDTO> changeSchool(
            Authentication authentication,
            @Valid @RequestBody SchoolChangeRequestDTO request
    ) {
        return ResponseEntity.ok(profileSchoolService.changeTeacherSchool(authentication.getName(), request));
    }

    @GetMapping("/notification-settings")
    public ResponseEntity<TeacherNotificationSettingsResponseDTO> getNotificationSettings(
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                teacherNotificationSettingsService.getNotificationSettings(authentication.getName())
        );
    }

    @PutMapping("/notification-settings")
    public ResponseEntity<TeacherNotificationSettingsResponseDTO> updateNotificationSettings(
            Authentication authentication,
            @Valid @RequestBody TeacherNotificationSettingsUpdateRequestDTO request
    ) {
        return ResponseEntity.ok(
                teacherNotificationSettingsService.updateNotificationSettings(authentication.getName(), request)
        );
    }
}
