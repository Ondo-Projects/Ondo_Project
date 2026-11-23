package com.ondo.domain.profile.dto;

import com.ondo.domain.user.entity.User;
import lombok.Getter;

@Getter
public class StudentNotificationSettingsResponseDTO {

    /** 선생님 답변 메일 알림 */
    private final boolean replyEmailEnabled;
    /** 알림을 받을 메일 주소 (가입 때 인증한 주소) */
    private final String email;

    public StudentNotificationSettingsResponseDTO(User student) {
        this.replyEmailEnabled = student.isReplyEmailEnabled();
        this.email = student.getEmail();
    }
}
