package com.ondo.domain.profile.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class StudentNotificationSettingsUpdateRequestDTO {

    @NotNull(message = "알림 설정 값을 보내 주세요.")
    private Boolean replyEmailEnabled;
}
