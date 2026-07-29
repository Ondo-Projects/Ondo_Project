package com.ondo.domain.schoollife.controller;

import com.ondo.domain.schoollife.dto.SchoolScheduleUpcomingResponseDTO;
import com.ondo.domain.schoollife.service.SchoolScheduleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/common/school-schedule")
@RequiredArgsConstructor
public class CommonSchoolScheduleController {

    private final SchoolScheduleService schoolScheduleService;

    @GetMapping("/upcoming")
    public ResponseEntity<SchoolScheduleUpcomingResponseDTO> getUpcomingSchedule(
            Authentication authentication,
            @RequestParam(defaultValue = "14") int days
    ) {
        return ResponseEntity.ok(
                schoolScheduleService.getUpcomingScheduleForHome(authentication.getName(), days)
        );
    }
}
