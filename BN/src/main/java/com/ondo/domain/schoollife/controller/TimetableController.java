package com.ondo.domain.schoollife.controller;

import com.ondo.domain.schoollife.dto.TimetableDayResponseDTO;
import com.ondo.domain.schoollife.service.TimetableService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/student/timetable")
@RequiredArgsConstructor
public class TimetableController {

    private final TimetableService timetableService;

    @GetMapping("/today")
    public ResponseEntity<TimetableDayResponseDTO> getTodayTimetable(Authentication authentication) {
        return ResponseEntity.ok(timetableService.getTodayTimetable(authentication.getName()));
    }
}
