package com.ondo.domain.user.service;

import com.ondo.domain.user.entity.Role;
import com.ondo.domain.user.policy.TeacherEmailDomains;
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
public class EmailVerificationService {

    private static final String CODE_PREFIX = "email:code:";
    private static final String VERIFIED_PREFIX = "email:verified:";
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$");

    private final StringRedisTemplate redisTemplate;
    private final JavaMailSender mailSender;

    @Value("${ondo.mail.dev-mode:true}")
    private boolean devMode;

    @Value("${spring.mail.username:ondo@ondo.local}")
    private String mailFrom;

    public void sendVerificationCode(String email, Role role) {
        String normalizedEmail = normalizeEmail(email);
        validateEmailForRole(normalizedEmail, role);

        String code = generateCode();
        redisTemplate.opsForValue().set(
                CODE_PREFIX + normalizedEmail,
                code,
                Duration.ofMinutes(5)
        );

        if (devMode) {
            log.info("[DEV] {} 이메일 인증번호 - {} : {}", roleLabel(role), normalizedEmail, code);
            return;
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailFrom);
        message.setTo(normalizedEmail);
        message.setSubject("[온도 상담웹] " + roleLabel(role) + " 이메일 인증번호");
        message.setText("""
                온도 상담웹 %s 가입을 위한 인증번호입니다.

                인증번호: %s

                인증번호는 5분간 유효합니다.
                """.formatted(roleLabel(role), code));
        mailSender.send(message);
    }

    public void verifyCode(String email, String code, Role role) {
        String normalizedEmail = normalizeEmail(email);
        validateEmailForRole(normalizedEmail, role);

        String savedCode = redisTemplate.opsForValue().get(CODE_PREFIX + normalizedEmail);
        if (savedCode == null) {
            throw new BusinessException("인증번호가 만료되었거나 존재하지 않습니다. 다시 발송해 주세요.");
        }
        if (!savedCode.equals(code)) {
            throw new BusinessException("인증번호가 일치하지 않습니다.");
        }

        redisTemplate.delete(CODE_PREFIX + normalizedEmail);
        redisTemplate.opsForValue().set(
                VERIFIED_PREFIX + normalizedEmail,
                "true",
                Duration.ofMinutes(30)
        );
    }

    public boolean isVerified(String email) {
        if (email == null || email.isBlank()) {
            return false;
        }
        return Boolean.TRUE.toString().equals(
                redisTemplate.opsForValue().get(VERIFIED_PREFIX + normalizeEmail(email))
        );
    }

    public void clearVerification(String email) {
        if (email == null || email.isBlank()) {
            return;
        }
        String normalizedEmail = normalizeEmail(email);
        redisTemplate.delete(CODE_PREFIX + normalizedEmail);
        redisTemplate.delete(VERIFIED_PREFIX + normalizedEmail);
    }

    public void validateEmailForRole(String email, Role role) {
        String normalizedEmail = normalizeEmail(email);
        if (!EMAIL_PATTERN.matcher(normalizedEmail).matches()) {
            throw new BusinessException("올바른 이메일 형식을 입력해 주세요.");
        }
        if (role == Role.TEACHER) {
            TeacherEmailDomains.validateTeacherEmail(normalizedEmail);
        }
    }

    private String roleLabel(Role role) {
        return role == Role.TEACHER ? "교사" : "학생";
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private String generateCode() {
        SecureRandom random = new SecureRandom();
        int value = random.nextInt(1_000_000);
        return String.format("%06d", value);
    }
}
