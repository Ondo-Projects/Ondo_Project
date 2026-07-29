package com.ondo.global.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(SmsOtpRateLimitProperties.class)
public class SmsOtpConfig {
}
