package com.ondo.domain.user.service;

import com.ondo.global.error.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;
import java.util.Locale;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
class AccountRecoveryOtpService {

    private static final String CODE_PREFIX = "recovery:code:";
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$");

    private final StringRedisTemplate redisTemplate;
    private final JavaMailSender mailSender;

    @Value("${ondo.mail.dev-mode:true}")
    private boolean devMode;

    @Value("${spring.mail.username:ondo@ondo.local}")
    private String mailFrom;

    void sendCode(RecoveryPurpose purpose, String scopeKey, String email, String subject, String bodyIntro) {
        String normalizedEmail = normalizeEmail(email);
        validateEmailFormat(normalizedEmail);

        String code = generateCode();
        redisTemplate.opsForValue().set(
                codeKey(purpose, scopeKey),
                code,
                Duration.ofMinutes(5)
        );

        if (devMode) {
            log.info("[DEV] {} 인증번호 - {} / {} : {}", purpose, scopeKey, normalizedEmail, code);
            return;
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailFrom);
        message.setTo(normalizedEmail);
        message.setSubject(subject);
        message.setText("""
                %s

                인증번호: %s

                인증번호는 5분간 유효합니다.
                """.formatted(bodyIntro, code));
        mailSender.send(message);
    }

    void verifyCode(RecoveryPurpose purpose, String scopeKey, String code) {
        if (code == null || code.isBlank()) {
            throw new BusinessException("인증번호를 입력해 주세요.");
        }

        String savedCode = redisTemplate.opsForValue().get(codeKey(purpose, scopeKey));
        if (savedCode == null) {
            throw new BusinessException("인증번호가 만료되었거나 존재하지 않습니다. 다시 발송해 주세요.");
        }
        if (!savedCode.equals(code.trim())) {
            throw new BusinessException("인증번호가 일치하지 않습니다.");
        }

        redisTemplate.delete(codeKey(purpose, scopeKey));
    }

    void validateEmailFormat(String email) {
        if (!EMAIL_PATTERN.matcher(email).matches()) {
            throw new BusinessException("올바른 이메일 형식을 입력해 주세요.");
        }
    }

    String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private String codeKey(RecoveryPurpose purpose, String scopeKey) {
        return CODE_PREFIX + purpose.keySegment() + ":" + scopeKey;
    }

    private String generateCode() {
        SecureRandom random = new SecureRandom();
        int value = random.nextInt(1_000_000);
        return String.format("%06d", value);
    }
}
