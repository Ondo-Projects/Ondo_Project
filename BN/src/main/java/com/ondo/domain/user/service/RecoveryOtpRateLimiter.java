package com.ondo.domain.user.service;

import com.ondo.global.config.SmsOtpRateLimitProperties;
import com.ondo.global.error.TooManyRequestsException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

@Component
@RequiredArgsConstructor
class RecoveryOtpRateLimiter {

    private static final String EMAIL_COOLDOWN_PREFIX = "recovery:rate:email:cooldown:";
    private static final String EMAIL_HOUR_PREFIX = "recovery:rate:email:hour:";
    private static final String IP_HOUR_PREFIX = "recovery:rate:ip:hour:";

    private final StringRedisTemplate redisTemplate;
    private final SmsOtpRateLimitProperties properties;

    void assertCanSend(String email, String clientIp) {
        if (!properties.isEnabled()) {
            return;
        }

        assertEmailCooldown(email);
        assertHourlyLimit(
                EMAIL_HOUR_PREFIX + email,
                properties.getPhoneMaxPerHour(),
                "해당 이메일로는 1시간에 최대 " + properties.getPhoneMaxPerHour()
                        + "회까지 인증번호를 발송할 수 있습니다."
        );

        if (clientIp != null && !clientIp.isBlank()) {
            assertHourlyLimit(
                    IP_HOUR_PREFIX + clientIp,
                    properties.getIpMaxPerHour(),
                    "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요."
            );
        }
    }

    void recordSend(String email, String clientIp) {
        if (!properties.isEnabled()) {
            return;
        }

        redisTemplate.opsForValue().set(
                EMAIL_COOLDOWN_PREFIX + email,
                "1",
                Duration.ofSeconds(properties.getResendCooldownSeconds())
        );
        incrementHourlyCounter(EMAIL_HOUR_PREFIX + email);

        if (clientIp != null && !clientIp.isBlank()) {
            incrementHourlyCounter(IP_HOUR_PREFIX + clientIp);
        }
    }

    private void assertEmailCooldown(String email) {
        String key = EMAIL_COOLDOWN_PREFIX + email;
        if (!Boolean.TRUE.equals(redisTemplate.hasKey(key))) {
            return;
        }

        Long remainingSeconds = redisTemplate.getExpire(key, TimeUnit.SECONDS);
        if (remainingSeconds == null || remainingSeconds <= 0) {
            throw new TooManyRequestsException(
                    "인증번호는 " + properties.getResendCooldownSeconds()
                            + "초에 한 번만 발송할 수 있습니다. 잠시 후 다시 시도해 주세요."
            );
        }

        throw new TooManyRequestsException(
                "인증번호는 " + properties.getResendCooldownSeconds()
                        + "초에 한 번만 발송할 수 있습니다. "
                        + remainingSeconds + "초 후 다시 시도해 주세요."
        );
    }

    private void assertHourlyLimit(String key, int maxPerHour, String message) {
        String countValue = redisTemplate.opsForValue().get(key);
        if (countValue == null) {
            return;
        }

        int count = Integer.parseInt(countValue);
        if (count >= maxPerHour) {
            throw new TooManyRequestsException(message);
        }
    }

    private void incrementHourlyCounter(String key) {
        Long count = redisTemplate.opsForValue().increment(key);
        if (count != null && count == 1L) {
            redisTemplate.expire(key, Duration.ofHours(1));
        }
    }
}
