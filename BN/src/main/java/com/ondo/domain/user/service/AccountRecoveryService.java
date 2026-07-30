package com.ondo.domain.user.service;

import com.ondo.domain.user.dto.FindIdSendRequestDTO;
import com.ondo.domain.user.dto.FindIdVerifyRequestDTO;
import com.ondo.domain.user.dto.FindIdVerifyResponseDTO;
import com.ondo.domain.user.dto.PasswordRecoveryResetRequestDTO;
import com.ondo.domain.user.dto.PasswordRecoverySendRequestDTO;
import com.ondo.domain.user.entity.Role;
import com.ondo.domain.user.entity.User;
import com.ondo.domain.user.repository.UserRepository;
import com.ondo.global.error.BusinessException;
import com.ondo.global.util.PasswordValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AccountRecoveryService {

    private final UserRepository userRepository;
    private final AccountRecoveryOtpService accountRecoveryOtpService;
    private final RecoveryOtpRateLimiter recoveryOtpRateLimiter;
    private final PasswordEncoder passwordEncoder;

    public Map<String, String> sendFindIdCode(FindIdSendRequestDTO request, String clientIp) {
        String email = accountRecoveryOtpService.normalizeEmail(request.getEmail());
        String name = normalizeName(request.getName());
        LocalDate birthDate = request.getBirthDate();

        validateBirthDate(birthDate);
        accountRecoveryOtpService.validateEmailFormat(email);
        recoveryOtpRateLimiter.assertCanSend(email, clientIp);

        Optional<User> user = findRecoverableUserByIdentity(email, name, birthDate);
        if (user.isPresent()) {
            accountRecoveryOtpService.sendCode(
                    RecoveryPurpose.FIND_ID,
                    email,
                    email,
                    "[온도 상담웹] 아이디 찾기 인증번호",
                    "온도 상담웹 아이디 찾기를 위한 인증번호입니다."
            );
        }

        recoveryOtpRateLimiter.recordSend(email, clientIp);
        return Map.of("message", AccountRecoverySupport.SEND_SUCCESS_MESSAGE);
    }

    public FindIdVerifyResponseDTO verifyFindId(FindIdVerifyRequestDTO request) {
        String email = accountRecoveryOtpService.normalizeEmail(request.getEmail());
        String name = normalizeName(request.getName());
        LocalDate birthDate = request.getBirthDate();

        validateBirthDate(birthDate);
        accountRecoveryOtpService.verifyCode(RecoveryPurpose.FIND_ID, email, request.getCode());

        User user = findRecoverableUserByIdentity(email, name, birthDate)
                .orElseThrow(() -> new BusinessException("입력하신 정보와 일치하는 계정을 찾을 수 없습니다."));

        String username = user.getUsername();
        return new FindIdVerifyResponseDTO(
                username,
                AccountRecoverySupport.maskUsername(username),
                "아이디를 확인했습니다."
        );
    }

    public Map<String, String> sendPasswordResetCode(PasswordRecoverySendRequestDTO request, String clientIp) {
        String username = normalizeUsername(request.getUsername());
        String email = accountRecoveryOtpService.normalizeEmail(request.getEmail());
        String scopeKey = AccountRecoverySupport.passwordScopeKey(username, email);

        accountRecoveryOtpService.validateEmailFormat(email);
        recoveryOtpRateLimiter.assertCanSend(email, clientIp);

        Optional<User> user = findRecoverableUserByUsernameAndEmail(username, email);
        if (user.isPresent()) {
            accountRecoveryOtpService.sendCode(
                    RecoveryPurpose.RESET_PASSWORD,
                    scopeKey,
                    email,
                    "[온도 상담웹] 비밀번호 재설정 인증번호",
                    "온도 상담웹 비밀번호 재설정을 위한 인증번호입니다."
            );
        }

        recoveryOtpRateLimiter.recordSend(email, clientIp);
        return Map.of("message", AccountRecoverySupport.SEND_SUCCESS_MESSAGE);
    }

    @Transactional
    public Map<String, String> resetPassword(PasswordRecoveryResetRequestDTO request) {
        String username = normalizeUsername(request.getUsername());
        String email = accountRecoveryOtpService.normalizeEmail(request.getEmail());
        String scopeKey = AccountRecoverySupport.passwordScopeKey(username, email);

        if (!request.getPassword().equals(request.getPasswordConfirm())) {
            throw new BusinessException("비밀번호와 비밀번호 확인이 일치하지 않습니다.");
        }
        PasswordValidator.validate(request.getPassword(), username);

        accountRecoveryOtpService.verifyCode(RecoveryPurpose.RESET_PASSWORD, scopeKey, request.getCode());

        User user = findRecoverableUserByUsernameAndEmail(username, email)
                .orElseThrow(() -> new BusinessException("입력하신 정보와 일치하는 계정을 찾을 수 없습니다."));

        user.changePassword(passwordEncoder.encode(request.getPassword()));
        return Map.of("message", "비밀번호가 변경되었습니다. 새 비밀번호로 로그인해 주세요.");
    }

    private Optional<User> findRecoverableUserByIdentity(String email, String name, LocalDate birthDate) {
        return userRepository.findByEmailAndNameAndBirthDateAndActiveTrue(email, name, birthDate)
                .filter(this::isRecoverable);
    }

    private Optional<User> findRecoverableUserByUsernameAndEmail(String username, String email) {
        return userRepository.findByUsernameAndEmailAndActiveTrue(username, email)
                .filter(this::isRecoverable);
    }

    private boolean isRecoverable(User user) {
        return user.getRole() != Role.ADMIN;
    }

    private String normalizeName(String name) {
        if (name == null || name.isBlank()) {
            throw new BusinessException("성명을 입력해 주세요.");
        }
        return name.trim();
    }

    private String normalizeUsername(String username) {
        if (username == null || username.isBlank()) {
            throw new BusinessException("아이디를 입력해 주세요.");
        }
        return username.trim();
    }

    private void validateBirthDate(LocalDate birthDate) {
        if (birthDate == null) {
            throw new BusinessException("생년월일을 입력해 주세요.");
        }
        if (birthDate.isAfter(LocalDate.now())) {
            throw new BusinessException("올바른 생년월일을 입력해 주세요.");
        }
    }
}
