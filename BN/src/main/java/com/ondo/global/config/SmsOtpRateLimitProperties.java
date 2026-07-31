package com.ondo.global.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "ondo.sms.otp")
public class SmsOtpRateLimitProperties {

    private boolean enabled = true;
    private int resendCooldownSeconds = 60;
    private int phoneMaxPerHour = 5;
    private int ipMaxPerHour = 20;
}
