package com.ondo.domain.profile.dto;

import com.ondo.domain.user.entity.User;
import lombok.Getter;

@Getter
public class TeacherNotificationSettingsResponseDTO {

    private final String phone;
    private final boolean smsNotifyEnabled;
    private final boolean ready;
    private final String message;

    public TeacherNotificationSettingsResponseDTO(User user, String message) {
        this.phone = user.getPhone();
        this.smsNotifyEnabled = user.isSmsNotifyEnabled();
        this.ready = user.getPhone() != null
                && !user.getPhone().isBlank()
                && user.isSmsNotifyEnabled();
        this.message = message;
    }
}
