package com.ondo.domain.mood.controller;

import com.ondo.domain.mood.dto.MoodRecordRequestDTO;
import com.ondo.domain.mood.dto.MoodRecordResponseDTO;
import com.ondo.domain.mood.dto.StudentMoodSummaryResponseDTO;
import com.ondo.domain.mood.dto.TeacherWeeklyMoodResponseDTO;
import com.ondo.domain.mood.service.MoodService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class MoodController {

    private final MoodService moodService;

    @PostMapping("/api/student/mood")
    public ResponseEntity<MoodRecordResponseDTO> saveTodayMood(
            Authentication authentication,
            @Valid @RequestBody MoodRecordRequestDTO request
    ) {
        return ResponseEntity.ok(moodService.saveTodayMood(authentication.getName(), request));
    }

    @GetMapping("/api/student/mood/today")
    public ResponseEntity<?> getTodayMood(Authentication authentication) {
        return moodService.findTodayMood(authentication.getName())
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.ok(Map.of("recorded", false)));
    }

    @GetMapping("/api/teacher/mood/today")
    public ResponseEntity<List<StudentMoodSummaryResponseDTO>> getAssignedStudentsTodayMood(Authentication authentication) {
        return ResponseEntity.ok(moodService.getAssignedStudentsTodayMood(authentication.getName()));
    }

    @GetMapping("/api/teacher/mood/weekly")
    public ResponseEntity<TeacherWeeklyMoodResponseDTO> getAssignedStudentsWeeklyMood(Authentication authentication) {
        return ResponseEntity.ok(moodService.getAssignedStudentsWeeklyMood(authentication.getName()));
    }
}
