package com.ondo.domain.counseling.service;

import com.ondo.domain.counseling.dto.CounselingCreateDTO;
import com.ondo.domain.counseling.dto.CounselingReplyDTO;
import com.ondo.domain.counseling.dto.CounselingResponseDTO;
import com.ondo.domain.counseling.dto.CounselingStatusUpdateDTO;
import com.ondo.domain.counseling.dto.CounselingUpdateDTO;
import com.ondo.domain.counseling.entity.CounselingAccessLog;
import com.ondo.domain.counseling.entity.CounselingPost;
import com.ondo.domain.counseling.entity.CounselingStatus;
import com.ondo.domain.counseling.entity.StudentTeacherAssignment;
import com.ondo.domain.counseling.repository.CounselingAccessLogRepository;
import com.ondo.domain.counseling.repository.CounselingPostRepository;
import com.ondo.domain.counseling.repository.StudentTeacherAssignmentRepository;
import com.ondo.domain.user.entity.Role;
import com.ondo.domain.user.entity.User;
import com.ondo.domain.user.repository.UserRepository;
import com.ondo.global.error.BusinessException;
import com.ondo.global.error.ForbiddenException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CounselingService {

    private final CounselingPostRepository counselingPostRepository;
    private final CounselingAccessLogRepository counselingAccessLogRepository;
    private final StudentTeacherAssignmentRepository assignmentRepository;
    private final UserRepository userRepository;

    @Transactional
    public CounselingResponseDTO create(String username, CounselingCreateDTO request) {
        User student = getUser(username);
        assertRole(student, Role.STUDENT);
        assertSensitiveAgreed(student);

        User teacher = getAssignedTeacher(student);
        LocalDateTime now = LocalDateTime.now();

        CounselingPost post = CounselingPost.builder()
                .student(student)
                .teacher(teacher)
                .title(request.getTitle())
                .content(request.getContent())
                .desiredDate(request.getDesiredDate())
                .counselingType(request.getCounselingType())
                .status(CounselingStatus.WAITING)
                .createdAt(now)
                .updatedAt(now)
                .build();

        return new CounselingResponseDTO(counselingPostRepository.save(post));
    }

    public List<CounselingResponseDTO> getMyPosts(String username) {
        User student = getUser(username);
        assertRole(student, Role.STUDENT);

        return counselingPostRepository.findByStudentAndDeletedAtIsNullOrderByCreatedAtDesc(student)
                .stream()
                .map(CounselingResponseDTO::new)
                .toList();
    }

    public List<CounselingResponseDTO> getTeacherPosts(String username, CounselingStatus status) {
        User teacher = getUser(username);
        assertRole(teacher, Role.TEACHER);

        List<User> students = assignmentRepository.findByTeacher(teacher).stream()
                .map(StudentTeacherAssignment::getStudent)
                .toList();

        if (students.isEmpty()) {
            return List.of();
        }

        List<CounselingPost> posts = status == null
                ? counselingPostRepository.findByStudentInAndDeletedAtIsNullOrderByCreatedAtDesc(students)
                : counselingPostRepository.findByStudentInAndStatusAndDeletedAtIsNullOrderByCreatedAtDesc(students, status);

        return posts.stream()
                .map(CounselingResponseDTO::new)
                .toList();
    }

    public long getTeacherUnreadCount(String username) {
        User teacher = getUser(username);
        assertRole(teacher, Role.TEACHER);

        List<User> students = assignmentRepository.findByTeacher(teacher).stream()
                .map(StudentTeacherAssignment::getStudent)
                .toList();

        if (students.isEmpty()) {
            return 0L;
        }

        return counselingPostRepository.countUnreadByStudents(students);
    }

    @Transactional
    public CounselingResponseDTO getPost(String username, Long id) {
        User user = getUser(username);
        CounselingPost post = getActivePost(id);
        assertCanAccess(post, user);

        if (user.getRole() == Role.TEACHER) {
            post.markAsReadByTeacher();
            counselingAccessLogRepository.save(CounselingAccessLog.builder()
                    .counselingPost(post)
                    .teacher(user)
                    .accessedAt(LocalDateTime.now())
                    .build());
        }

        return new CounselingResponseDTO(post);
    }

    @Transactional
    public CounselingResponseDTO updateStatus(String username, Long id, CounselingStatusUpdateDTO request) {
        User teacher = getUser(username);
        assertRole(teacher, Role.TEACHER);

        CounselingPost post = getActivePost(id);
        assertAssignedTeacher(post, teacher);
        assertStatusTransition(post, request.getStatus());

        post.changeStatus(request.getStatus());
        return new CounselingResponseDTO(post);
    }

    @Transactional
    public CounselingResponseDTO reply(String username, Long id, CounselingReplyDTO request) {
        User teacher = getUser(username);
        assertRole(teacher, Role.TEACHER);

        CounselingPost post = getActivePost(id);
        assertAssignedTeacher(post, teacher);

        if (!post.isReplyable()) {
            throw new BusinessException("취소된 상담에는 답변할 수 없습니다.");
        }

        post.reply(request.getReply());
        return new CounselingResponseDTO(post);
    }

    @Transactional
    public CounselingResponseDTO update(String username, Long id, CounselingUpdateDTO request) {
        User student = getUser(username);
        assertRole(student, Role.STUDENT);

        CounselingPost post = getActivePost(id);
        assertOwner(post, student);
        assertEditable(post);

        post.update(
                request.getTitle(),
                request.getContent(),
                request.getDesiredDate(),
                request.getCounselingType()
        );

        return new CounselingResponseDTO(post);
    }

    @Transactional
    public void delete(String username, Long id) {
        User student = getUser(username);
        assertRole(student, Role.STUDENT);

        CounselingPost post = getActivePost(id);
        assertOwner(post, student);
        assertEditable(post);

        post.softDelete();
    }

    private User getUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("사용자를 찾을 수 없습니다."));
    }

    private User getAssignedTeacher(User student) {
        return assignmentRepository.findByStudent(student)
                .map(StudentTeacherAssignment::getTeacher)
                .orElseThrow(() -> new BusinessException("담당 교사가 등록되지 않았습니다. 교사 초대 코드로 담당 교사를 등록해 주세요."));
    }

    private CounselingPost getActivePost(Long id) {
        return counselingPostRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new BusinessException("상담 사전 정보를 찾을 수 없습니다."));
    }

    private void assertRole(User user, Role role) {
        if (user.getRole() != role) {
            throw new BusinessException("접근 권한이 없습니다.");
        }
    }

    private void assertSensitiveAgreed(User student) {
        if (!student.isAgreeSensitive()) {
            throw new BusinessException("민감정보 수집 및 이용에 동의해야 상담 사전 정보를 작성할 수 있습니다.");
        }
    }

    private void assertOwner(CounselingPost post, User student) {
        if (!post.isOwnedBy(student)) {
            throw new BusinessException("본인이 작성한 상담 사전 정보만 수정하거나 삭제할 수 있습니다.");
        }
    }

    private void assertEditable(CounselingPost post) {
        if (!post.isEditable()) {
            throw new BusinessException("대기 중인 상담 사전 정보만 수정하거나 삭제할 수 있습니다.");
        }
    }

    private void assertCanAccess(CounselingPost post, User user) {
        if (user.getRole() == Role.STUDENT && post.isOwnedBy(user)) {
            return;
        }
        if (user.getRole() == Role.TEACHER && post.isAssignedTo(user)) {
            return;
        }
        throw new ForbiddenException("접근 권한이 없습니다.");
    }

    private void assertAssignedTeacher(CounselingPost post, User teacher) {
        if (!post.isAssignedTo(teacher)) {
            throw new BusinessException("담당 학생의 상담 사전 정보만 처리할 수 있습니다.");
        }
    }

    private void assertStatusTransition(CounselingPost post, CounselingStatus newStatus) {
        if (!post.canTransitionTo(newStatus)) {
            throw new BusinessException("현재 상태에서 해당 상태로 변경할 수 없습니다.");
        }
    }
}
