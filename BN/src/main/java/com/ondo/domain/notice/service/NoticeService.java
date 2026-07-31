package com.ondo.domain.notice.service;

import com.ondo.domain.counseling.repository.StudentTeacherAssignmentRepository;
import com.ondo.domain.notice.dto.NoticeCreateDTO;
import com.ondo.domain.notice.dto.NoticeResponseDTO;
import com.ondo.domain.notice.entity.TeacherNotice;
import com.ondo.domain.notice.repository.TeacherNoticeRepository;
import com.ondo.domain.user.entity.Role;
import com.ondo.domain.user.entity.User;
import com.ondo.domain.user.repository.UserRepository;
import com.ondo.global.error.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NoticeService {

    private final TeacherNoticeRepository noticeRepository;
    private final StudentTeacherAssignmentRepository assignmentRepository;
    private final UserRepository userRepository;

    @Transactional
    public NoticeResponseDTO createNotice(String username, NoticeCreateDTO request) {
        User teacher = getUser(username);
        assertRole(teacher, Role.TEACHER);

        TeacherNotice notice = TeacherNotice.builder()
                .teacher(teacher)
                .title(request.getTitle().trim())
                .content(request.getContent().trim())
                .createdAt(LocalDateTime.now())
                .build();

        return new NoticeResponseDTO(noticeRepository.save(notice));
    }

    public List<NoticeResponseDTO> getTeacherNotices(String username) {
        User teacher = getUser(username);
        assertRole(teacher, Role.TEACHER);

        return noticeRepository.findByTeacherOrderByCreatedAtDesc(teacher).stream()
                .map(NoticeResponseDTO::new)
                .toList();
    }

    public List<NoticeResponseDTO> getStudentNotices(String username) {
        User student = getUser(username);
        assertRole(student, Role.STUDENT);

        User teacher = assignmentRepository.findByStudent(student)
                .orElseThrow(() -> new BusinessException("등록된 담당 교사가 없습니다."))
                .getTeacher();

        return noticeRepository.findByTeacherOrderByCreatedAtDesc(teacher).stream()
                .map(NoticeResponseDTO::new)
                .toList();
    }

    @Transactional
    public void deleteNotice(String username, Long noticeId) {
        User teacher = getUser(username);
        assertRole(teacher, Role.TEACHER);

        TeacherNotice notice = noticeRepository.findById(noticeId)
                .orElseThrow(() -> new BusinessException("삭제할 알림을 찾을 수 없습니다."));

        if (!notice.getTeacher().getUsername().equals(teacher.getUsername())) {
            throw new BusinessException("본인이 등록한 알림만 삭제할 수 있습니다.");
        }

        noticeRepository.delete(notice);
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
}
