package com.ondo.domain.profile.service;

import com.ondo.domain.profile.dto.StudentClassProfileResponseDTO;
import com.ondo.domain.profile.dto.StudentClassProfileUpdateRequestDTO;
import com.ondo.domain.school.entity.School;
import com.ondo.domain.user.entity.Role;
import com.ondo.domain.user.entity.User;
import com.ondo.domain.user.repository.UserRepository;
import com.ondo.global.error.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StudentClassProfileService {

    private final UserRepository userRepository;

    public StudentClassProfileResponseDTO getClassProfile(String username) {
        return StudentClassProfileResponseDTO.from(getStudent(username), null);
    }

    @Transactional
    public StudentClassProfileResponseDTO updateClassProfile(
            String username,
            StudentClassProfileUpdateRequestDTO request
    ) {
        User student = getStudent(username);
        Integer grade = request.getGrade();
        Integer classNumber = request.getClassNumber();

        if (grade == null && classNumber == null) {
            student.updateClassProfile(null, null);
            return StudentClassProfileResponseDTO.from(student, "학년·반 정보가 초기화되었습니다.");
        }

        if (grade == null || classNumber == null) {
            throw new BusinessException("학년과 반을 함께 입력해 주세요.");
        }

        validateClassProfile(student.getSchool(), grade, classNumber);
        student.updateClassProfile(grade, classNumber);
        return StudentClassProfileResponseDTO.from(student, "학년·반이 저장되었습니다.");
    }

    private void validateClassProfile(School school, int grade, int classNumber) {
        if (classNumber < 1 || classNumber > 20) {
            throw new BusinessException("반은 1~20 사이로 입력해 주세요.");
        }

        String schoolType = school.getSchoolType();
        if ("중".equals(schoolType) || "고".equals(schoolType)) {
            if (grade < 1 || grade > 3) {
                throw new BusinessException("학년은 1~3 사이로 입력해 주세요.");
            }
            return;
        }

        if (grade < 1 || grade > 6) {
            throw new BusinessException("학년은 1~6 사이로 입력해 주세요.");
        }
    }

    private User getStudent(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("사용자를 찾을 수 없습니다."));
        if (user.getRole() != Role.STUDENT) {
            throw new BusinessException("접근 권한이 없습니다.");
        }
        return user;
    }
}
