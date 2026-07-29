package com.ondo.global.sms;

import com.ondo.global.config.SmsOtpRateLimitProperties;
import com.ondo.global.error.TooManyRequestsException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

@Component
@RequiredArgsConstructor
public class SmsOtpRateLimiter {

    private static final String PHONE_COOLDOWN_PREFIX = "sms:rate:phone:cooldown:";
    private static final String PHONE_HOUR_PREFIX = "sms:rate:phone:hour:";
    private static final String IP_HOUR_PREFIX = "sms:rate:ip:hour:";

    private final StringRedisTemplate redisTemplate;
    private final SmsOtpRateLimitProperties properties;

    public void assertCanSend(String phone, String clientIp) {
        if (!properties.isEnabled()) {
            return;
        }

        assertPhoneCooldown(phone);
        assertHourlyLimit(PHONE_HOUR_PREFIX + phone, properties.getPhoneMaxPerHour(),
                "해당 휴대전화 번호로는 1시간에 최대 " + properties.getPhoneMaxPerHour()
                        + "회까지 인증번호를 발송할 수 있습니다.");

        if (clientIp != null && !clientIp.isBlank()) {
            assertHourlyLimit(IP_HOUR_PREFIX + clientIp, properties.getIpMaxPerHour(),
                    "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.");
        }
    }

    public void recordSend(String phone, String clientIp) {
        if (!properties.isEnabled()) {
            return;
        }

        redisTemplate.opsForValue().set(
                PHONE_COOLDOWN_PREFIX + phone,
                "1",
                Duration.ofSeconds(properties.getResendCooldownSeconds())
        );
        incrementHourlyCounter(PHONE_HOUR_PREFIX + phone);

        if (clientIp != null && !clientIp.isBlank()) {
            incrementHourlyCounter(IP_HOUR_PREFIX + clientIp);
        }
    }

    private void assertPhoneCooldown(String phone) {
        String key = PHONE_COOLDOWN_PREFIX + phone;
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
