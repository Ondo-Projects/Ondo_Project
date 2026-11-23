package com.ondo.domain.profile.service;

import com.ondo.domain.profile.dto.StudentNotificationSettingsResponseDTO;
import com.ondo.domain.profile.dto.StudentNotificationSettingsUpdateRequestDTO;
import com.ondo.domain.user.entity.Role;
import com.ondo.domain.user.entity.User;
import com.ondo.domain.user.repository.UserRepository;
import com.ondo.global.error.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** 학생 알림 설정 (선생님 답변 메일) */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StudentNotificationSettingsService {

    private final UserRepository userRepository;

    public StudentNotificationSettingsResponseDTO get(String username) {
        return new StudentNotificationSettingsResponseDTO(getStudent(username));
    }

    @Transactional
    public StudentNotificationSettingsResponseDTO update(String username, StudentNotificationSettingsUpdateRequestDTO request) {
        User student = getStudent(username);
        student.updateReplyEmailEnabled(Boolean.TRUE.equals(request.getReplyEmailEnabled()));
        return new StudentNotificationSettingsResponseDTO(student);
    }

    private User getStudent(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("사용자를 찾을 수 없습니다."));
        if (user.getRole() != Role.STUDENT) {
            throw new BusinessException("학생만 이 알림 설정을 바꿀 수 있습니다.");
        }
        return user;
    }
}
