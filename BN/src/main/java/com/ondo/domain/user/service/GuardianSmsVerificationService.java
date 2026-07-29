package com.ondo.domain.user.service;

import com.ondo.domain.user.dto.GuardianSmsSendRequestDTO;
import com.ondo.global.error.BusinessException;
import com.ondo.global.sms.SmsOtpRateLimiter;
import com.ondo.global.sms.SmsPhoneUtils;
import com.ondo.global.sms.SolapiSmsSender;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;

@Service
@RequiredArgsConstructor
@Slf4j
public class GuardianSmsVerificationService {

    private static final String CODE_PREFIX = "sms:code:";
    private static final String VERIFIED_PREFIX = "sms:verified:";

    private final StringRedisTemplate redisTemplate;
    private final SolapiSmsSender solapiSmsSender;
    private final SmsOtpRateLimiter smsOtpRateLimiter;

    public void sendVerificationCode(GuardianSmsSendRequestDTO request, String clientIp) {
        String phone = SmsPhoneUtils.normalizePhone(request.getPhone());
        SmsPhoneUtils.validatePhone(phone);
        smsOtpRateLimiter.assertCanSend(phone, clientIp);

        String code = generateCode();
        redisTemplate.opsForValue().set(CODE_PREFIX + phone, code, Duration.ofMinutes(5));

        String message = """
                [온도 상담웹]
                자녀 %s의 회원가입을 위한
                법정대리인(%s) 동의 인증번호입니다.

                인증번호: %s

                5분 내에 입력해 주세요.
                """.formatted(request.getStudentName().trim(), request.getGuardianName().trim(), code);

        smsOtpRateLimiter.recordSend(phone, clientIp);
        solapiSmsSender.sendSms(phone, message);
    }

    public void verifyCode(String phone, String code) {
        String normalizedPhone = SmsPhoneUtils.normalizePhone(phone);
        SmsPhoneUtils.validatePhone(normalizedPhone);

        String savedCode = redisTemplate.opsForValue().get(CODE_PREFIX + normalizedPhone);
        if (savedCode == null) {
            throw new BusinessException("인증번호가 만료되었거나 존재하지 않습니다. 다시 발송해 주세요.");
        }
        if (!savedCode.equals(code)) {
            throw new BusinessException("인증번호가 일치하지 않습니다.");
        }

        redisTemplate.delete(CODE_PREFIX + normalizedPhone);
        redisTemplate.opsForValue().set(VERIFIED_PREFIX + normalizedPhone, "true", Duration.ofMinutes(30));
    }

    public boolean isVerified(String phone) {
        if (phone == null || phone.isBlank()) {
            return false;
        }
        String normalizedPhone = SmsPhoneUtils.normalizePhone(phone);
        return Boolean.TRUE.toString().equals(redisTemplate.opsForValue().get(VERIFIED_PREFIX + normalizedPhone));
    }

    public void clearVerification(String phone) {
        if (phone == null || phone.isBlank()) {
            return;
        }
        String normalizedPhone = SmsPhoneUtils.normalizePhone(phone);
        redisTemplate.delete(CODE_PREFIX + normalizedPhone);
        redisTemplate.delete(VERIFIED_PREFIX + normalizedPhone);
    }

    private String generateCode() {
        SecureRandom random = new SecureRandom();
        return String.format("%06d", random.nextInt(1_000_000));
    }
}
