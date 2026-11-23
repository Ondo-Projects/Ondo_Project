package com.ondo.domain.assignment.service;

import com.ondo.domain.assignment.dto.AssignmentRequestDTO;
import com.ondo.domain.assignment.dto.AssignmentResponseDTO;
import com.ondo.domain.assignment.dto.ClassReleaseResponseDTO;
import com.ondo.domain.assignment.dto.ClassStudentResponseDTO;
import com.ondo.domain.assignment.dto.InviteCodeResponseDTO;
import com.ondo.domain.assignment.entity.TeacherInviteCode;
import com.ondo.domain.assignment.repository.TeacherInviteCodeRepository;
import com.ondo.domain.counseling.entity.CounselingPost;
import com.ondo.domain.counseling.entity.CounselingStatus;
import com.ondo.domain.counseling.entity.StudentTeacherAssignment;
import com.ondo.domain.counseling.repository.CounselingPostRepository;
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
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AssignmentService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final TeacherInviteCodeRepository inviteCodeRepository;
    private final StudentTeacherAssignmentRepository assignmentRepository;
    private final UserRepository userRepository;
    private final CounselingPostRepository counselingPostRepository;

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

    /**
     * 새 학기 등으로 담임이 바뀔 때, 새 담임의 초대코드로 연결을 옮깁니다.
     * 지난 담임에게 보낸 끝나지 않은 상담(대기·확정)은 답할 사람이 없어지므로 취소합니다.
     * 지난 상담 기록은 학생에게 그대로 남고, 새 담임에게는 보이지 않습니다.
     */
    @Transactional
    public AssignmentResponseDTO changeAssignment(String username, AssignmentRequestDTO request) {
        User student = getUser(username);
        assertRole(student, Role.STUDENT);

        StudentTeacherAssignment current = assignmentRepository.findByStudent(student)
                .orElseThrow(() -> new BusinessException("연결된 담임 선생님이 없어요. 초대 코드로 먼저 연결해 주세요."));

        User newTeacher = inviteCodeRepository.findByCode(request.getInviteCode())
                .map(TeacherInviteCode::getTeacher)
                .orElseThrow(() -> new BusinessException("유효하지 않은 초대 코드입니다."));

        if (current.getTeacher().getUsername().equals(newTeacher.getUsername())) {
            throw new BusinessException("이미 이 선생님과 연결돼 있어요.");
        }
        assertSameSchool(student, newTeacher);

        cancelOpenCounselings(student, current.getTeacher());
        assignmentRepository.delete(current);
        assignmentRepository.flush();

        assignmentRepository.save(StudentTeacherAssignment.builder()
                .teacher(newTeacher)
                .student(student)
                .assignedAt(LocalDateTime.now())
                .build());

        return assignmentRepository.findByStudentWithDetails(student)
                .map(AssignmentResponseDTO::new)
                .orElseThrow(() -> new BusinessException("담임 변경 처리 중 오류가 발생했습니다."));
    }

    /** 교사 설정 화면의 '우리 반 학생' 목록 */
    public List<ClassStudentResponseDTO> getClassStudents(String teacherUsername) {
        User teacher = getUser(teacherUsername);
        assertRole(teacher, Role.TEACHER);

        return assignmentRepository.findByTeacher(teacher).stream()
                .map(ClassStudentResponseDTO::new)
                .sorted(Comparator
                        .comparing((ClassStudentResponseDTO item) -> item.getStudentName() == null ? "" : item.getStudentName())
                        .thenComparing(ClassStudentResponseDTO::getStudentUsername))
                .toList();
    }

    /** 전학, 잘못 연결한 학생 등 한 명의 연결을 풉니다. */
    @Transactional
    public ClassReleaseResponseDTO releaseStudent(String teacherUsername, String studentUsername) {
        User teacher = getUser(teacherUsername);
        assertRole(teacher, Role.TEACHER);

        StudentTeacherAssignment assignment = userRepository.findByUsername(studentUsername)
                .flatMap(assignmentRepository::findByStudent)
                .filter(found -> found.getTeacher().getUsername().equals(teacher.getUsername()))
                .orElseThrow(() -> new BusinessException("우리 반에 연결된 학생이 아닙니다."));

        int cancelled = cancelOpenCounselings(assignment.getStudent(), teacher);
        assignmentRepository.delete(assignment);
        return new ClassReleaseResponseDTO(1, cancelled, null);
    }

    /**
     * 학년이 끝났을 때 학급 연결을 모두 풉니다.
     * 지난 학생이 예전 코드로 다시 들어오지 않도록 초대코드도 새로 발급합니다.
     */
    @Transactional
    public ClassReleaseResponseDTO releaseClass(String teacherUsername) {
        User teacher = getUser(teacherUsername);
        assertRole(teacher, Role.TEACHER);

        List<StudentTeacherAssignment> assignments = assignmentRepository.findByTeacher(teacher);
        int cancelled = 0;
        for (StudentTeacherAssignment assignment : assignments) {
            cancelled += cancelOpenCounselings(assignment.getStudent(), teacher);
        }
        assignmentRepository.deleteAll(assignments);

        TeacherInviteCode inviteCode = inviteCodeRepository.findByTeacher(teacher)
                .orElseGet(() -> createInviteCode(teacher));
        inviteCode.regenerate(generateUniqueCode());

        return new ClassReleaseResponseDTO(assignments.size(), cancelled, inviteCode.getCode());
    }

    /** 이 담임에게 보낸 끝나지 않은 상담(대기·확정)을 취소하고 그 수를 돌려줍니다. */
    private int cancelOpenCounselings(User student, User teacher) {
        int cancelled = 0;
        for (CounselingPost post : counselingPostRepository.findByStudentAndDeletedAtIsNullOrderByCreatedAtDesc(student)) {
            if (post.isAssignedTo(teacher) && post.canTransitionTo(CounselingStatus.CANCELLED)) {
                post.changeStatus(CounselingStatus.CANCELLED);
                cancelled++;
            }
        }
        return cancelled;
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
