package com.ondo.domain.user.service;

import com.ondo.domain.school.entity.School;
import com.ondo.domain.school.repository.SchoolRepository;
import com.ondo.domain.user.dto.SignUpRequestDTO;
import com.ondo.domain.user.dto.UsernameCheckResponseDTO;
import com.ondo.domain.user.entity.Role;
import com.ondo.domain.user.entity.User;
import com.ondo.domain.user.repository.UserRepository;
import com.ondo.global.error.BusinessException;
import com.ondo.global.sms.NcpSensSmsSender;
import com.ondo.global.util.AgePolicy;
import com.ondo.global.util.PasswordValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final SchoolRepository schoolRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailVerificationService emailVerificationService;
    private final GuardianSmsVerificationService guardianSmsVerificationService;

    @Transactional
    public void signUp(SignUpRequestDTO request) {
        if (request.getRole() == Role.ADMIN) {
            throw new BusinessException("관리자 계정은 회원가입으로 생성할 수 없습니다.");
        }

        if (!request.getPassword().equals(request.getPasswordConfirm())) {
            throw new BusinessException("비밀번호와 비밀번호 확인이 일치하지 않습니다.");
        }
        PasswordValidator.validate(request.getPassword(), request.getUsername());

        String username = request.getUsername().trim();
        if (username.length() < 4 || username.length() > 50) {
            throw new BusinessException("아이디는 4~50자여야 합니다.");
        }

        if (userRepository.existsByUsername(username)) {
            throw new BusinessException("이미 사용 중인 아이디입니다.");
        }

        School school = schoolRepository.findById(request.getSchoolCode())
                .orElseThrow(() -> new BusinessException("선택한 학교를 찾을 수 없습니다."));

        String email = null;
        String name = null;
        LocalDate birthDate = null;
        String guardianName = null;
        String guardianPhone = null;
        var guardianRelation = request.getGuardianRelation();
        boolean agreeGuardianChildPrivacy = false;
        boolean agreeGuardianChildSensitive = false;
        boolean agreeGuardianIdentity = false;
        LocalDateTime guardianAgreedAt = null;

        if (request.getRole() == Role.STUDENT) {
            validateStudentSignup(request);
            name = request.getName().trim();
            birthDate = request.getBirthDate();
            email = validateAndGetVerifiedEmail(request.getEmail(), Role.STUDENT);

            if (AgePolicy.isUnder14(birthDate)) {
                validateGuardianSignup(request);
                guardianName = request.getGuardianName().trim();
                guardianPhone = NcpSensSmsSender.normalizePhone(request.getGuardianPhone());
                agreeGuardianChildPrivacy = request.isAgreeGuardianChildPrivacy();
                agreeGuardianChildSensitive = request.isAgreeGuardianChildSensitive();
                agreeGuardianIdentity = request.isAgreeGuardianIdentity();
                guardianAgreedAt = LocalDateTime.now();

                if (!guardianSmsVerificationService.isVerified(guardianPhone)) {
                    throw new BusinessException("법정대리인 SMS 인증을 완료해 주세요.");
                }
            }
        }

        if (request.getRole() == Role.TEACHER) {
            validateTeacherSignup(request);
            name = request.getName().trim();
            email = validateAndGetVerifiedEmail(request.getEmail(), Role.TEACHER);
        }

        User user = User.builder()
                .username(username)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .school(school)
                .name(name)
                .birthDate(birthDate)
                .email(email)
                .guardianName(guardianName)
                .guardianPhone(guardianPhone)
                .guardianRelation(guardianRelation)
                .agreeGuardianChildPrivacy(agreeGuardianChildPrivacy)
                .agreeGuardianChildSensitive(agreeGuardianChildSensitive)
                .agreeGuardianIdentity(agreeGuardianIdentity)
                .guardianAgreedAt(guardianAgreedAt)
                .agreeService(request.isAgreeService())
                .agreePrivacy(request.isAgreePrivacy())
                .agreeSensitive(request.isAgreeSensitive())
                .agreedAt(LocalDateTime.now())
                .build();

        userRepository.save(user);

        if (email != null) {
            emailVerificationService.clearVerification(email);
        }
        if (guardianPhone != null) {
            guardianSmsVerificationService.clearVerification(guardianPhone);
        }
    }

    private String validateAndGetVerifiedEmail(String rawEmail, Role role) {
        if (rawEmail == null || rawEmail.isBlank()) {
            throw new BusinessException(role == Role.TEACHER
                    ? "교사 가입은 @korea.kr 이메일이 필요합니다."
                    : "학생 이메일을 입력해 주세요.");
        }
        String email = rawEmail.trim().toLowerCase();
        emailVerificationService.validateEmailForRole(email, role);
        if (!emailVerificationService.isVerified(email)) {
            throw new BusinessException("이메일 인증을 완료해 주세요.");
        }
        if (userRepository.existsByEmail(email)) {
            throw new BusinessException("이미 등록된 이메일입니다.");
        }
        return email;
    }

    private void validateStudentSignup(SignUpRequestDTO request) {
        if (request.getName() == null || request.getName().isBlank()) {
            throw new BusinessException("성명을 입력해 주세요.");
        }
        if (request.getBirthDate() == null) {
            throw new BusinessException("생년월일을 입력해 주세요.");
        }
        if (request.getBirthDate().isAfter(LocalDate.now())) {
            throw new BusinessException("올바른 생년월일을 입력해 주세요.");
        }
    }

    private void validateTeacherSignup(SignUpRequestDTO request) {
        if (request.getName() == null || request.getName().isBlank()) {
            throw new BusinessException("교사 성명을 입력해 주세요.");
        }
    }

    private void validateGuardianSignup(SignUpRequestDTO request) {
        if (request.getGuardianName() == null || request.getGuardianName().isBlank()) {
            throw new BusinessException("법정대리인 성명을 입력해 주세요.");
        }
        if (request.getGuardianPhone() == null || request.getGuardianPhone().isBlank()) {
            throw new BusinessException("법정대리인 휴대전화번호를 입력해 주세요.");
        }
        NcpSensSmsSender.validatePhone(request.getGuardianPhone());
        if (request.getGuardianRelation() == null) {
            throw new BusinessException("법정대리인과의 관계를 선택해 주세요.");
        }
        if (!request.isAgreeGuardianChildPrivacy()) {
            throw new BusinessException("만 14세 미만 아동 개인정보 수집·이용에 동의해야 합니다.");
        }
        if (!request.isAgreeGuardianChildSensitive()) {
            throw new BusinessException("만 14세 미만 아동 민감정보 수집·이용에 동의해야 합니다.");
        }
        if (!request.isAgreeGuardianIdentity()) {
            throw new BusinessException("법정대리인 본인 확인 및 개인정보 수집에 동의해야 합니다.");
        }
    }

    public UsernameCheckResponseDTO checkUsernameAvailability(String rawUsername) {
        if (rawUsername == null || rawUsername.isBlank()) {
            throw new BusinessException("아이디를 입력해 주세요.");
        }

        String username = rawUsername.trim();
        if (username.length() < 4 || username.length() > 50) {
            throw new BusinessException("아이디는 4~50자여야 합니다.");
        }

        boolean available = !userRepository.existsByUsername(username);
        if (available) {
            return new UsernameCheckResponseDTO(true, "사용 가능한 아이디입니다.");
        }
        return new UsernameCheckResponseDTO(false, "이미 사용 중인 아이디입니다.");
    }
}
