package com.ondo.domain.assignment.service;

import com.ondo.domain.assignment.dto.AssignmentRequestDTO;
import com.ondo.domain.assignment.dto.AssignmentResponseDTO;
import com.ondo.domain.assignment.dto.InviteCodeResponseDTO;
import com.ondo.domain.assignment.entity.TeacherInviteCode;
import com.ondo.domain.assignment.repository.TeacherInviteCodeRepository;
import com.ondo.domain.counseling.entity.StudentTeacherAssignment;
import com.ondo.domain.counseling.repository.StudentTeacherAssignmentRepository;
import com.ondo.domain.user.entity.Role;
import com.ondo.domain.user.entity.User;
import com.ondo.domain.user.repository.UserRepository;
import com.ondo.global.error.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AssignmentService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final TeacherInviteCodeRepository inviteCodeRepository;
    private final StudentTeacherAssignmentRepository assignmentRepository;
    private final UserRepository userRepository;

    @Transactional
    public InviteCodeResponseDTO getOrCreateInviteCode(String username) {
        User teacher = getUser(username);
        assertRole(teacher, Role.TEACHER);

        return inviteCodeRepository.findByTeacher(teacher)
                .map(InviteCodeResponseDTO::new)
                .orElseGet(() -> new InviteCodeResponseDTO(createInviteCode(teacher)));
    }

    @Transactional
    public InviteCodeResponseDTO regenerateInviteCode(String username) {
        User teacher = getUser(username);
        assertRole(teacher, Role.TEACHER);

        TeacherInviteCode inviteCode = inviteCodeRepository.findByTeacher(teacher)
                .orElseGet(() -> createInviteCode(teacher));

        inviteCode.regenerate(generateUniqueCode());
        return new InviteCodeResponseDTO(inviteCode);
    }

    @Transactional
    public AssignmentResponseDTO registerAssignment(String username, AssignmentRequestDTO request) {
        User student = getUser(username);
        assertRole(student, Role.STUDENT);

        if (assignmentRepository.findByStudent(student).isPresent()) {
            throw new BusinessException("이미 담당 교사가 등록되어 있습니다.");
        }

        User teacher = inviteCodeRepository.findByCode(request.getInviteCode())
                .map(TeacherInviteCode::getTeacher)
                .orElseThrow(() -> new BusinessException("유효하지 않은 초대 코드입니다."));

        assertSameSchool(student, teacher);

        StudentTeacherAssignment assignment = StudentTeacherAssignment.builder()
                .teacher(teacher)
                .student(student)
                .assignedAt(LocalDateTime.now())
                .build();

        assignmentRepository.save(assignment);

        return assignmentRepository.findByStudentWithDetails(student)
                .map(AssignmentResponseDTO::new)
                .orElseThrow(() -> new BusinessException("담당 교사 등록 처리 중 오류가 발생했습니다."));
    }

    public AssignmentResponseDTO getMyAssignment(String username) {
        User student = getUser(username);
        assertRole(student, Role.STUDENT);

        return assignmentRepository.findByStudentWithDetails(student)
                .map(AssignmentResponseDTO::new)
                .orElseThrow(() -> new BusinessException("등록된 담당 교사가 없습니다."));
    }

    public java.util.Optional<AssignmentResponseDTO> findMyAssignmentOptional(String username) {
        User student = getUser(username);
        assertRole(student, Role.STUDENT);

        return assignmentRepository.findByStudentWithDetails(student)
                .map(AssignmentResponseDTO::new);
    }

    private TeacherInviteCode createInviteCode(User teacher) {
        TeacherInviteCode inviteCode = TeacherInviteCode.builder()
                .teacher(teacher)
                .code(generateUniqueCode())
                .createdAt(LocalDateTime.now())
                .build();

        return inviteCodeRepository.save(inviteCode);
    }

    private String generateUniqueCode() {
        String code;
        do {
            code = String.format("%06d", RANDOM.nextInt(1_000_000));
        } while (inviteCodeRepository.existsByCode(code));
        return code;
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

    private void assertSameSchool(User student, User teacher) {
        if (!student.getSchool().getSchoolCode().equals(teacher.getSchool().getSchoolCode())) {
            throw new BusinessException("같은 학교 교사만 담당 교사로 등록할 수 있습니다.");
        }
    }
}
