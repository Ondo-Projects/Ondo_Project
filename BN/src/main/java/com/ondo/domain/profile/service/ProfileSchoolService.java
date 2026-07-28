package com.ondo.domain.profile.service;

import com.ondo.domain.counseling.entity.StudentTeacherAssignment;
import com.ondo.domain.counseling.repository.StudentTeacherAssignmentRepository;
import com.ondo.domain.profile.dto.ProfileSchoolResponseDTO;
import com.ondo.domain.profile.dto.SchoolChangeRequestDTO;
import com.ondo.domain.school.entity.School;
import com.ondo.domain.school.repository.SchoolRepository;
import com.ondo.domain.user.entity.Role;
import com.ondo.domain.user.entity.User;
import com.ondo.domain.user.repository.UserRepository;
import com.ondo.global.error.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProfileSchoolService {

    private final UserRepository userRepository;
    private final SchoolRepository schoolRepository;
    private final StudentTeacherAssignmentRepository assignmentRepository;

    public ProfileSchoolResponseDTO getMySchool(String username, Role role) {
        User user = getUser(username, role);
        return toResponse(user.getSchool(), null);
    }

    @Transactional
    public ProfileSchoolResponseDTO changeStudentSchool(String username, SchoolChangeRequestDTO request) {
        User student = getUser(username, Role.STUDENT);
        School newSchool = resolveSchool(request.getSchoolCode());
        assertDifferentSchool(student.getSchool(), newSchool);

        assignmentRepository.findByStudent(student).ifPresent(assignmentRepository::delete);

        student.changeSchool(newSchool);
        return toResponse(
                newSchool,
                "학교가 변경되었습니다. 새 학교 교사의 초대 코드로 담당 교사를 다시 등록해 주세요."
        );
    }

    @Transactional
    public ProfileSchoolResponseDTO changeTeacherSchool(String username, SchoolChangeRequestDTO request) {
        User teacher = getUser(username, Role.TEACHER);
        School newSchool = resolveSchool(request.getSchoolCode());
        assertDifferentSchool(teacher.getSchool(), newSchool);

        List<StudentTeacherAssignment> assignments = assignmentRepository.findByTeacher(teacher);
        if (!assignments.isEmpty()) {
            assignmentRepository.deleteAll(assignments);
        }

        teacher.changeSchool(newSchool);
        return toResponse(
                newSchool,
                "학교가 변경되었습니다. 기존 담당 학생 연결이 해제되었습니다."
        );
    }

    private School resolveSchool(String schoolCode) {
        String trimmedCode = schoolCode == null ? "" : schoolCode.trim();
        return schoolRepository.findById(trimmedCode)
                .orElseThrow(() -> new BusinessException("선택한 학교를 찾을 수 없습니다."));
    }

    private void assertDifferentSchool(School currentSchool, School newSchool) {
        if (currentSchool.getSchoolCode().equals(newSchool.getSchoolCode())) {
            throw new BusinessException("이미 등록된 학교입니다.");
        }
    }

    private User getUser(String username, Role role) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("사용자를 찾을 수 없습니다."));
        if (user.getRole() != role) {
            throw new BusinessException("접근 권한이 없습니다.");
        }
        return user;
    }

    private ProfileSchoolResponseDTO toResponse(School school, String message) {
        return new ProfileSchoolResponseDTO(school, message);
    }
}
