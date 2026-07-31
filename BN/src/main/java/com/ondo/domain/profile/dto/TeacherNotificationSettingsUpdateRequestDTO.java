package com.ondo.domain.profile.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TeacherNotificationSettingsUpdateRequestDTO {

    private String phone;
    private boolean smsNotifyEnabled;
}
