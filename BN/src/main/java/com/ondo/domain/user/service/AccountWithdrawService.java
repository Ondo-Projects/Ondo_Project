package com.ondo.domain.user.service;

import com.ondo.domain.user.dto.AccountWithdrawRequestDTO;
import com.ondo.domain.user.entity.Role;
import com.ondo.domain.user.entity.StudentWithdrawReason;
import com.ondo.domain.user.entity.TeacherWithdrawReason;
import com.ondo.domain.user.entity.User;
import com.ondo.domain.user.entity.UserWithdrawal;
import com.ondo.domain.user.repository.UserRepository;
import com.ondo.domain.user.repository.UserWithdrawalRepository;
import com.ondo.global.error.BusinessException;
import com.ondo.global.error.ForbiddenException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AccountWithdrawService {

    private static final String SUCCESS_MESSAGE = "회원 탈퇴가 완료되었습니다.";

    private final UserRepository userRepository;
    private final UserWithdrawalRepository userWithdrawalRepository;
    private final PasswordEncoder passwordEncoder;
    private final LogoutService logoutService;

    @Transactional
    public Map<String, String> withdraw(
            String username,
            AccountWithdrawRequestDTO request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse
    ) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("사용자를 찾을 수 없습니다."));

        assertWithdrawAllowed(user);

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BusinessException("비밀번호가 일치하지 않습니다.");
        }

        String normalizedReason = normalizeReason(user.getRole(), request.getReason());
        String normalizedReasonDetail = normalizeReasonDetail(normalizedReason, request.getReasonDetail());

        LocalDateTime withdrawnAt = LocalDateTime.now();
        user.withdraw(withdrawnAt);

        userWithdrawalRepository.save(UserWithdrawal.builder()
                .username(user.getUsername())
                .role(user.getRole())
                .reason(normalizedReason)
                .reasonDetail(normalizedReasonDetail)
                .withdrawnAt(withdrawnAt)
                .build());

        logoutService.logout(httpRequest, httpResponse, null);

        return Map.of("message", SUCCESS_MESSAGE);
    }

    private void assertWithdrawAllowed(User user) {
        if (user.getRole() == Role.ADMIN) {
            throw new ForbiddenException("관리자 계정은 회원 탈퇴 API로 탈퇴할 수 없습니다.");
        }
        if (!user.isActive()) {
            throw new BusinessException("이미 탈퇴했거나 비활성화된 계정입니다.");
        }
    }

    private String normalizeReason(Role role, String reason) {
        if (!StringUtils.hasText(reason)) {
            return null;
        }

        String trimmed = reason.trim();
        if (role == Role.STUDENT) {
            return parseStudentReason(trimmed).name();
        }
        if (role == Role.TEACHER) {
            return parseTeacherReason(trimmed).name();
        }

        throw new BusinessException("탈퇴할 수 없는 계정 유형입니다.");
    }

    private StudentWithdrawReason parseStudentReason(String reason) {
        try {
            return StudentWithdrawReason.valueOf(reason);
        } catch (IllegalArgumentException exception) {
            throw new BusinessException("올바른 탈퇴 사유를 선택해 주세요.");
        }
    }

    private TeacherWithdrawReason parseTeacherReason(String reason) {
        try {
            return TeacherWithdrawReason.valueOf(reason);
        } catch (IllegalArgumentException exception) {
            throw new BusinessException("올바른 탈퇴 사유를 선택해 주세요.");
        }
    }

    private String normalizeReasonDetail(String reason, String reasonDetail) {
        if (!StringUtils.hasText(reasonDetail)) {
            if ("OTHER".equals(reason)) {
                return null;
            }
            return null;
        }

        String trimmed = reasonDetail.trim();
        if (trimmed.length() > 500) {
            throw new BusinessException("기타 사유는 500자 이내로 입력해 주세요.");
        }
        return trimmed;
    }
}
