package com.ondo.domain.user.service;

import com.ondo.domain.user.dto.GuardianSmsSendRequestDTO;
import com.ondo.global.sms.SmsOtpRateLimiter;
import com.ondo.global.sms.SolapiSmsSender;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GuardianSmsVerificationServiceTest {

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @Mock
    private SolapiSmsSender solapiSmsSender;

    @Mock
    private SmsOtpRateLimiter smsOtpRateLimiter;

    private GuardianSmsVerificationService service;

    @BeforeEach
    void setUp() {
        service = new GuardianSmsVerificationService(redisTemplate, solapiSmsSender, smsOtpRateLimiter);
    }

    @Test
    void sendVerificationCode_checksRateLimitBeforeSending() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);

        GuardianSmsSendRequestDTO request = new GuardianSmsSendRequestDTO();
        request.setStudentName("홍길동");
        request.setGuardianName("홍부모");
        request.setPhone("010-1234-5678");

        service.sendVerificationCode(request, "127.0.0.1");

        verify(smsOtpRateLimiter).assertCanSend("01012345678", "127.0.0.1");
        verify(smsOtpRateLimiter).recordSend("01012345678", "127.0.0.1");
        verify(valueOperations).set(eq("sms:code:01012345678"), anyString(), eq(java.time.Duration.ofMinutes(5)));
        verify(solapiSmsSender).sendSms(eq("01012345678"), anyString());
    }
}
