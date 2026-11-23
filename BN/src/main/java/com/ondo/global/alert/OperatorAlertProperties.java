package com.ondo.global.alert;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * 운영자 오류 알림 설정 (ondo.alert.*)
 * 운영 서버의 application-prod.properties 에 ondo.alert.email 을 넣어야 메일이 나갑니다.
 */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "ondo.alert")
public class OperatorAlertProperties {

    /** 알림 전체 켜기·끄기 */
    private boolean enabled = true;

    /** 받을 메일 주소. 비어 있으면 메일을 보내지 않고 로그만 남깁니다. */
    private String email = "";

    /** 같은 종류의 오류는 이 시간(분) 안에 한 번만 보냅니다. */
    private int cooldownMinutes = 30;

    /** 하루에 보낼 수 있는 최대 알림 수 (메일 발송 한도 보호) */
    private int dailyLimit = 30;
}
