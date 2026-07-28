package com.ondo.domain.precounseling.service;

import com.ondo.domain.counseling.entity.StudentTeacherAssignment;
import com.ondo.domain.counseling.repository.StudentTeacherAssignmentRepository;
import com.ondo.domain.precounseling.dto.PreCounselingProfileResponseDTO;
import com.ondo.domain.precounseling.dto.PreCounselingProfileSaveRequestDTO;
import com.ondo.domain.precounseling.dto.PreCounselingProfileSummaryDTO;
import com.ondo.domain.precounseling.entity.PreCounselingProfileAccessLog;
import com.ondo.domain.precounseling.entity.StudentPreCounselingProfile;
import com.ondo.domain.precounseling.repository.PreCounselingProfileAccessLogRepository;
import com.ondo.domain.precounseling.repository.StudentPreCounselingProfileRepository;
import com.ondo.domain.user.entity.Role;
import com.ondo.domain.user.entity.User;
import com.ondo.domain.user.repository.UserRepository;
import com.ondo.global.crypto.FieldEncryptionService;
import com.ondo.global.error.BusinessException;
import com.ondo.global.sms.NcpSensSmsSender;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PreCounselingProfileService {

    private static final DateTimeFormatter SUMMARY_DATE = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private final StudentPreCounselingProfileRepository profileRepository;
    private final PreCounselingProfileAccessLogRepository accessLogRepository;
    private final StudentTeacherAssignmentRepository assignmentRepository;
    private final UserRepository userRepository;
    private final FieldEncryptionService fieldEncryptionService;

    public PreCounselingProfileResponseDTO getMyProfile(String username) {
        User student = getUser(username);
        assertRole(student, Role.STUDENT);
        assertSensitiveAgreed(student);

        return profileRepository.findById(student.getUsername())
                .map(profile -> PreCounselingProfileResponseDTO.from(student, profile, fieldEncryptionService))
                .orElseGet(() -> PreCounselingProfileResponseDTO.empty(student));
    }

    @Transactional
    public PreCounselingProfileResponseDTO saveMyProfile(String username, PreCounselingProfileSaveRequestDTO request) {
        User student = getUser(username);
        assertRole(student, Role.STUDENT);
        assertSensitiveAgreed(student);

        String studentPhone = normalizePhone(request.getStudentPhone());
        String parentPhone = normalizePhone(request.getParentPhone());
        String studentPhoneEncrypted = fieldEncryptionService.encrypt(studentPhone);
        String parentPhoneEncrypted = fieldEncryptionService.encrypt(parentPhone);
        String mbti = normalizeOptional(request.getMbti());
        LocalDateTime now = LocalDateTime.now();

        StudentPreCounselingProfile profile = profileRepository.findById(student.getUsername())
                .map(existing -> {
                    existing.update(
                            studentPhoneEncrypted,
                            parentPhoneEncrypted,
                            mbti,
                            request.getFutureHope().trim(),
                            request.getFavoriteWords().trim(),
                            request.getPersonalityStrength().trim(),
                            request.getPersonalityWeakness().trim(),
                            request.getHobbiesSpecialtiesInterests().trim(),
                            request.getHappiestMoment().trim(),
                            request.getStressfulMoment().trim(),
                            request.getStressReliefMethod().trim(),
                            request.getMemorableSchoolMoment().trim(),
                            request.getDesiredFriendType().trim(),
                            request.getDesiredClassRole().trim()
                    );
                    return existing;
                })
                .orElseGet(() -> StudentPreCounselingProfile.builder()
                        .student(student)
                        .studentPhoneEncrypted(studentPhoneEncrypted)
                        .parentPhoneEncrypted(parentPhoneEncrypted)
                        .mbti(mbti)
                        .futureHope(request.getFutureHope().trim())
                        .favoriteWords(request.getFavoriteWords().trim())
                        .personalityStrength(request.getPersonalityStrength().trim())
                        .personalityWeakness(request.getPersonalityWeakness().trim())
                        .hobbiesSpecialtiesInterests(request.getHobbiesSpecialtiesInterests().trim())
                        .happiestMoment(request.getHappiestMoment().trim())
                        .stressfulMoment(request.getStressfulMoment().trim())
                        .stressReliefMethod(request.getStressReliefMethod().trim())
                        .memorableSchoolMoment(request.getMemorableSchoolMoment().trim())
                        .desiredFriendType(request.getDesiredFriendType().trim())
                        .desiredClassRole(request.getDesiredClassRole().trim())
                        .createdAt(now)
                        .updatedAt(now)
                        .build());

        StudentPreCounselingProfile saved = profileRepository.save(profile);
        return PreCounselingProfileResponseDTO.from(student, saved, fieldEncryptionService);
    }

    public List<PreCounselingProfileSummaryDTO> getAssignedStudentSummaries(String teacherUsername) {
        User teacher = getUser(teacherUsername);
        assertRole(teacher, Role.TEACHER);

        List<User> students = assignmentRepository.findByTeacher(teacher).stream()
                .map(StudentTeacherAssignment::getStudent)
                .toList();

        if (students.isEmpty()) {
            return List.of();
        }

        Set<String> completedUsernames = new HashSet<>(profileRepository.findAllById(
                students.stream().map(User::getUsername).toList()
        ).stream().map(StudentPreCounselingProfile::getStudentUsername).toList());

        return students.stream()
                .map(student -> {
                    boolean completed = completedUsernames.contains(student.getUsername());
                    String updatedAt = profileRepository.findById(student.getUsername())
                            .map(profile -> profile.getUpdatedAt().format(SUMMARY_DATE))
                            .orElse(null);
                    return new PreCounselingProfileSummaryDTO(
                            student.getUsername(),
                            student.getName(),
                            completed,
                            updatedAt
                    );
                })
                .toList();
    }

    @Transactional
    public PreCounselingProfileResponseDTO getAssignedStudentProfile(String teacherUsername, String studentUsername) {
        User teacher = getUser(teacherUsername);
        assertRole(teacher, Role.TEACHER);

        User student = getUser(studentUsername);
        assertRole(student, Role.STUDENT);
        assertAssigned(teacher, student);

        StudentPreCounselingProfile profile = profileRepository.findById(student.getUsername())
                .orElseThrow(() -> new BusinessException("학생이 아직 사전 상담 카드를 작성하지 않았습니다."));

        accessLogRepository.save(PreCounselingProfileAccessLog.builder()
                .student(student)
                .teacher(teacher)
                .accessedAt(LocalDateTime.now())
                .build());

        return PreCounselingProfileResponseDTO.from(student, profile, fieldEncryptionService);
    }

    private User getUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("사용자를 찾을 수 없습니다."));
    }

    private void assertRole(User user, Role role) {
        if (user.getRole() != role) {
            throw new BusinessException("접근 권한이 없습니다.");
        }
    }

    private void assertSensitiveAgreed(User student) {
        if (!student.isAgreeSensitive()) {
            throw new BusinessException("민감정보 수집 및 이용에 동의해야 사전 상담 카드를 작성할 수 있습니다.");
        }
    }

    private void assertAssigned(User teacher, User student) {
        boolean assigned = assignmentRepository.findByStudent(student)
                .map(assignment -> assignment.getTeacher().getUsername().equals(teacher.getUsername()))
                .orElse(false);
        if (!assigned) {
            throw new BusinessException("담당 학생의 사전 상담 카드만 열람할 수 있습니다.");
        }
    }

    private String normalizePhone(String phone) {
        String normalized = NcpSensSmsSender.normalizePhone(phone);
        NcpSensSmsSender.validatePhone(normalized);
        return normalized;
    }

    private String normalizeOptional(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
