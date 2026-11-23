package com.ondo.domain.assignment.controller;

import com.ondo.domain.assignment.dto.ClassReleaseResponseDTO;
import com.ondo.domain.assignment.dto.ClassStudentResponseDTO;
import com.ondo.domain.assignment.service.AssignmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** 교사의 학급(연결된 학생) 관리 */
@RestController
@RequestMapping("/api/teacher/class")
@RequiredArgsConstructor
public class TeacherClassController {

    private final AssignmentService assignmentService;

    @GetMapping("/students")
    public ResponseEntity<List<ClassStudentResponseDTO>> getClassStudents(Authentication authentication) {
        return ResponseEntity.ok(assignmentService.getClassStudents(authentication.getName()));
    }

    /** 학생 한 명 연결 해제 */
    @DeleteMapping("/students/{studentUsername}")
    public ResponseEntity<ClassReleaseResponseDTO> releaseStudent(
            Authentication authentication,
            @PathVariable String studentUsername
    ) {
        return ResponseEntity.ok(assignmentService.releaseStudent(authentication.getName(), studentUsername));
    }

    /** 새 학기 학급 정리: 연결을 모두 풀고 초대코드를 새로 발급 */
    @PostMapping("/release")
    public ResponseEntity<ClassReleaseResponseDTO> releaseClass(Authentication authentication) {
        return ResponseEntity.ok(assignmentService.releaseClass(authentication.getName()));
    }
}
