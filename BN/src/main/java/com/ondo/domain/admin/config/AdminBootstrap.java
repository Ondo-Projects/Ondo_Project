package com.ondo.domain.admin.config;

import com.ondo.domain.school.entity.School;
import com.ondo.domain.school.repository.SchoolRepository;
import com.ondo.domain.user.entity.Role;
import com.ondo.domain.user.entity.User;
import com.ondo.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;

@Component
@Order(100)
@RequiredArgsConstructor
@Slf4j
public class AdminBootstrap implements CommandLineRunner {

    private static final String ADMIN_SCHOOL_CODE = "ADMIN_SYS";

    private final AdminProperties adminProperties;
    private final UserRepository userRepository;
    private final SchoolRepository schoolRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (!adminProperties.isEnabled()) {
            return;
        }

        String username = adminProperties.getUsername().trim();
        if (!StringUtils.hasText(username)) {
            log.warn("ondo.admin.bootstrap.enabled=true 이지만 username이 비어 있어 Admin 계정을 생성하지 않습니다.");
            return;
        }

        if (userRepository.existsByUsername(username)) {
            return;
        }

        if (!StringUtils.hasText(adminProperties.getPassword())) {
            log.warn("Admin 계정({})이 없지만 password가 설정되지 않아 생성하지 않습니다.", username);
            return;
        }

        School adminSchool = schoolRepository.findById(ADMIN_SCHOOL_CODE)
                .orElseGet(() -> schoolRepository.save(School.builder()
                        .schoolCode(ADMIN_SCHOOL_CODE)
                        .schoolName("시스템 관리")
                        .region("운영")
                        .schoolType("관")
                        .build()));

        userRepository.save(User.builder()
                .username(username)
                .password(passwordEncoder.encode(adminProperties.getPassword()))
                .role(Role.ADMIN)
                .school(adminSchool)
                .name(adminProperties.getName())
                .agreeService(true)
                .agreePrivacy(true)
                .agreeSensitive(true)
                .agreedAt(LocalDateTime.now())
                .build());

        log.info("Admin 계정이 생성되었습니다: {}", username);
    }
}
