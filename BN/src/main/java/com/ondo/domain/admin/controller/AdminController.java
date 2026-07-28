package com.ondo.domain.admin.controller;

import com.ondo.domain.admin.dto.AdminActionResponseDTO;
import com.ondo.domain.admin.dto.AdminActivityLogDTO;
import com.ondo.domain.admin.dto.AdminCounselingAccessLogDTO;
import com.ondo.domain.admin.dto.AdminDashboardResponseDTO;
import com.ondo.domain.admin.dto.AdminPageResponseDTO;
import com.ondo.domain.admin.dto.AdminPreCounselAccessLogDTO;
import com.ondo.domain.admin.dto.AdminSchoolSummaryDTO;
import com.ondo.domain.admin.dto.AdminNeisSyncResponseDTO;
import com.ondo.domain.admin.dto.AdminSchoolSyncResponseDTO;
import com.ondo.domain.admin.dto.AdminStatisticsResponseDTO;
import com.ondo.domain.admin.dto.AdminSystemStatusResponseDTO;
import com.ondo.domain.admin.dto.AdminUserSchoolChangeRequestDTO;
import com.ondo.domain.admin.dto.AdminUserStatusRequestDTO;
import com.ondo.domain.admin.dto.AdminUserSummaryDTO;
import com.ondo.domain.admin.service.AdminService;
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
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/dashboard")
    public ResponseEntity<AdminDashboardResponseDTO> dashboard() {
        return ResponseEntity.ok(adminService.getDashboard());
    }

    @GetMapping("/system-status")
    public ResponseEntity<AdminSystemStatusResponseDTO> systemStatus() {
        return ResponseEntity.ok(adminService.getSystemStatus());
    }

    @GetMapping("/statistics")
    public ResponseEntity<AdminStatisticsResponseDTO> statistics() {
        return ResponseEntity.ok(adminService.getStatistics());
    }

    @GetMapping("/users")
    public ResponseEntity<AdminPageResponseDTO<AdminUserSummaryDTO>> users(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String schoolCode,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(adminService.searchUsers(role, keyword, schoolCode, page, size));
    }

    @PatchMapping("/users/{username}/status")
    public ResponseEntity<AdminUserSummaryDTO> updateUserStatus(
            Authentication authentication,
            @PathVariable String username,
            @Valid @RequestBody AdminUserStatusRequestDTO request
    ) {
        return ResponseEntity.ok(adminService.updateUserStatus(
                authentication.getName(),
                username,
                request.getActive()
        ));
    }

    @PatchMapping("/users/{username}/school")
    public ResponseEntity<AdminUserSummaryDTO> changeUserSchool(
            Authentication authentication,
            @PathVariable String username,
            @Valid @RequestBody AdminUserSchoolChangeRequestDTO request
    ) {
        return ResponseEntity.ok(adminService.changeUserSchool(
                authentication.getName(),
                username,
                request.getSchoolCode()
        ));
    }

    @GetMapping("/schools")
    public ResponseEntity<AdminPageResponseDTO<AdminSchoolSummaryDTO>> schools(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Boolean mapped,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(adminService.searchSchools(keyword, mapped, page, size));
    }

    @PostMapping("/schools/sync-csv")
    public ResponseEntity<AdminSchoolSyncResponseDTO> syncSchools(Authentication authentication) {
        return ResponseEntity.ok(adminService.syncSchoolsFromCsv(authentication.getName()));
    }

    @PostMapping("/schools/sync-neis")
    public ResponseEntity<AdminNeisSyncResponseDTO> syncNeisSchoolCodes(
            Authentication authentication,
            @RequestParam(defaultValue = "50") int limit
    ) {
        return ResponseEntity.ok(adminService.syncNeisSchoolCodes(authentication.getName(), limit));
    }

    @GetMapping("/access-logs/counseling")
    public ResponseEntity<AdminPageResponseDTO<AdminCounselingAccessLogDTO>> counselingAccessLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(adminService.getCounselingAccessLogs(page, size));
    }

    @GetMapping("/access-logs/pre-counseling")
    public ResponseEntity<AdminPageResponseDTO<AdminPreCounselAccessLogDTO>> preCounselAccessLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(adminService.getPreCounselAccessLogs(page, size));
    }

    @GetMapping("/activity-logs")
    public ResponseEntity<AdminPageResponseDTO<AdminActivityLogDTO>> activityLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(adminService.getActivityLogs(page, size));
    }
}
