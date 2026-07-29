package com.ondo.global.sms;

import com.ondo.global.config.SmsOtpRateLimitProperties;
import com.ondo.global.error.TooManyRequestsException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SmsOtpRateLimiterTest {

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    private SmsOtpRateLimitProperties properties;
    private SmsOtpRateLimiter rateLimiter;

    @BeforeEach
    void setUp() {
        properties = new SmsOtpRateLimitProperties();
        properties.setResendCooldownSeconds(60);
        properties.setPhoneMaxPerHour(5);
        properties.setIpMaxPerHour(20);
        rateLimiter = new SmsOtpRateLimiter(redisTemplate, properties);
    }

    @Test
    void assertCanSend_allowsWhenNoLimitsHit() {
        when(redisTemplate.hasKey("sms:rate:phone:cooldown:01012345678")).thenReturn(false);
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get("sms:rate:phone:hour:01012345678")).thenReturn(null);
        when(valueOperations.get("sms:rate:ip:hour:127.0.0.1")).thenReturn(null);

        assertThatCode(() -> rateLimiter.assertCanSend("01012345678", "127.0.0.1"))
                .doesNotThrowAnyException();
    }

    @Test
    void assertCanSend_rejectsWhenCooldownActive() {
        when(redisTemplate.hasKey("sms:rate:phone:cooldown:01012345678")).thenReturn(true);
        when(redisTemplate.getExpire("sms:rate:phone:cooldown:01012345678", TimeUnit.SECONDS)).thenReturn(42L);

        assertThatThrownBy(() -> rateLimiter.assertCanSend("01012345678", "127.0.0.1"))
                .isInstanceOf(TooManyRequestsException.class)
                .hasMessageContaining("42초 후");
    }

    @Test
    void assertCanSend_rejectsWhenPhoneHourlyLimitReached() {
        when(redisTemplate.hasKey("sms:rate:phone:cooldown:01012345678")).thenReturn(false);
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get("sms:rate:phone:hour:01012345678")).thenReturn("5");

        assertThatThrownBy(() -> rateLimiter.assertCanSend("01012345678", "127.0.0.1"))
                .isInstanceOf(TooManyRequestsException.class)
                .hasMessageContaining("1시간에 최대 5회");
    }

    @Test
    void assertCanSend_rejectsWhenIpHourlyLimitReached() {
        when(redisTemplate.hasKey("sms:rate:phone:cooldown:01012345678")).thenReturn(false);
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get("sms:rate:phone:hour:01012345678")).thenReturn(null);
        when(valueOperations.get("sms:rate:ip:hour:127.0.0.1")).thenReturn("20");

        assertThatThrownBy(() -> rateLimiter.assertCanSend("01012345678", "127.0.0.1"))
                .isInstanceOf(TooManyRequestsException.class)
                .hasMessageContaining("요청이 너무 많습니다");
    }

    @Test
    void assertCanSend_skipsWhenDisabled() {
        properties.setEnabled(false);

        assertThatCode(() -> rateLimiter.assertCanSend("01012345678", "127.0.0.1"))
                .doesNotThrowAnyException();

        verify(redisTemplate, never()).hasKey(any());
    }

    @Test
    void recordSend_setsCooldownAndIncrementsCounters() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.increment("sms:rate:phone:hour:01012345678")).thenReturn(1L);
        when(valueOperations.increment("sms:rate:ip:hour:127.0.0.1")).thenReturn(1L);

        rateLimiter.recordSend("01012345678", "127.0.0.1");

        verify(valueOperations).set(
                eq("sms:rate:phone:cooldown:01012345678"),
                eq("1"),
                eq(Duration.ofSeconds(60))
        );
        verify(redisTemplate).expire("sms:rate:phone:hour:01012345678", Duration.ofHours(1));
        verify(redisTemplate).expire("sms:rate:ip:hour:127.0.0.1", Duration.ofHours(1));
    }
}
