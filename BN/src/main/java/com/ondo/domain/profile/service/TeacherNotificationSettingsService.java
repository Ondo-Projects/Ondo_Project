package com.ondo.domain.profile.service;

import com.ondo.domain.profile.dto.TeacherNotificationSettingsResponseDTO;
import com.ondo.domain.profile.dto.TeacherNotificationSettingsUpdateRequestDTO;
import com.ondo.domain.user.entity.Role;
import com.ondo.domain.user.entity.User;
import com.ondo.domain.user.repository.UserRepository;
import com.ondo.global.error.BusinessException;
import com.ondo.global.sms.SmsPhoneUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TeacherNotificationSettingsService {

    private final UserRepository userRepository;

    public TeacherNotificationSettingsResponseDTO getNotificationSettings(String username) {
        User teacher = getTeacher(username);
        return new TeacherNotificationSettingsResponseDTO(teacher, null);
    }

    @Transactional
    public TeacherNotificationSettingsResponseDTO updateNotificationSettings(
            String username,
            TeacherNotificationSettingsUpdateRequestDTO request
    ) {
        User teacher = getTeacher(username);
        String normalizedPhone = resolvePhone(request.getPhone());

        if (request.isSmsNotifyEnabled() && normalizedPhone == null) {
            throw new BusinessException("SMS 수신 동의를 하려면 휴대전화 번호를 입력해 주세요.");
        }

        teacher.updateNotificationSettings(normalizedPhone, request.isSmsNotifyEnabled() && normalizedPhone != null);
        return new TeacherNotificationSettingsResponseDTO(
                teacher,
                "상담 알림 설정이 저장되었습니다."
        );
    }

    private String resolvePhone(String rawPhone) {
        if (rawPhone == null || rawPhone.isBlank()) {
            return null;
        }
        String normalizedPhone = SmsPhoneUtils.normalizePhone(rawPhone);
        SmsPhoneUtils.validatePhone(normalizedPhone);
        return normalizedPhone;
    }

    private User getTeacher(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("사용자를 찾을 수 없습니다."));
        if (user.getRole() != Role.TEACHER) {
            throw new BusinessException("교사만 알림 설정을 변경할 수 있습니다.");
        }
        return user;
    }
}
