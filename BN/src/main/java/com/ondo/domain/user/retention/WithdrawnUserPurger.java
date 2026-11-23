package com.ondo.domain.user.retention;

import com.ondo.domain.user.entity.Role;
import com.ondo.domain.user.entity.User;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 탈퇴 회원 한 명의 개인정보와 게시물을 파기합니다. 회원 한 명마다 별도 트랜잭션으로 실행됩니다.
 *
 * <ul>
 *   <li>학생: 상담 글(교사 답변 포함)과 그 열람 기록, 사전상담 프로필과 그 열람 기록, 기분 기록,
 *       학급 연결, 운영 건의를 지우고 계정 행까지 삭제합니다.</li>
 *   <li>교사: 학급 공지, 초대코드, 학급 연결, 운영 건의를 지우고, 계정은 개인정보를 비운 빈 껍데기로 남깁니다.
 *       학생이 쓴 상담 글이 이 계정을 담당 교사로 가리키고 있기 때문입니다.</li>
 * </ul>
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class WithdrawnUserPurger {

    private final PasswordEncoder passwordEncoder;

    @PersistenceContext
    private EntityManager em;

    @Transactional
    public boolean purge(String username, LocalDateTime now) {
        User user = em.find(User.class, username);
        if (user == null || user.isActive() || user.getWithdrawnAt() == null
                || user.getPurgedAt() != null || user.getRole() == Role.ADMIN) {
            return false;
        }

        em.flush();
        Role role = user.getRole();
        if (role == Role.STUDENT) {
            purgeStudent(user);
        } else if (role == Role.TEACHER) {
            purgeTeacher(user, now);
        } else {
            return false;
        }
        anonymizeWithdrawalRecords(username);
        em.flush();
        em.clear();
        log.info("[retention] 탈퇴 회원 파기 완료 role={}", role);
        return true;
    }

    private void purgeStudent(User student) {
        String username = student.getUsername();
        em.createQuery("""
                        DELETE FROM CounselingAccessLog l
                        WHERE l.counselingPost.id IN (SELECT p.id FROM CounselingPost p WHERE p.student = :user)
                        """)
                .setParameter("user", student).executeUpdate();
        em.createQuery("DELETE FROM CounselingPost p WHERE p.student = :user")
                .setParameter("user", student).executeUpdate();
        em.createQuery("DELETE FROM PreCounselingProfileAccessLog l WHERE l.student = :user")
                .setParameter("user", student).executeUpdate();
        em.createQuery("DELETE FROM StudentPreCounselingProfile p WHERE p.studentUsername = :username")
                .setParameter("username", username).executeUpdate();
        em.createQuery("DELETE FROM MoodRecord m WHERE m.student = :user")
                .setParameter("user", student).executeUpdate();
        em.createQuery("DELETE FROM StudentTeacherAssignment a WHERE a.student = :user")
                .setParameter("user", student).executeUpdate();
        em.createQuery("DELETE FROM SuggestionPost s WHERE s.author = :user")
                .setParameter("user", student).executeUpdate();
        em.createQuery("DELETE FROM User u WHERE u.username = :username")
                .setParameter("username", username).executeUpdate();
    }

    private void purgeTeacher(User teacher, LocalDateTime now) {
        String username = teacher.getUsername();
        em.createQuery("DELETE FROM TeacherNotice n WHERE n.teacher = :user")
                .setParameter("user", teacher).executeUpdate();
        em.createQuery("DELETE FROM TeacherInviteCode c WHERE c.teacher = :user")
                .setParameter("user", teacher).executeUpdate();
        em.createQuery("DELETE FROM StudentTeacherAssignment a WHERE a.teacher = :user")
                .setParameter("user", teacher).executeUpdate();
        em.createQuery("DELETE FROM SuggestionPost s WHERE s.author = :user")
                .setParameter("user", teacher).executeUpdate();

        em.clear();
        User managed = em.find(User.class, username);
        managed.anonymizeAfterPurge(passwordEncoder.encode(UUID.randomUUID().toString()), now);
    }

    /** 탈퇴 사유 기록은 통계용으로만 남기고, 누구의 기록인지 알 수 없게 바꿉니다. */
    private void anonymizeWithdrawalRecords(String username) {
        em.createQuery("""
                        UPDATE UserWithdrawal w
                        SET w.username = CONCAT('purged-', CAST(w.id AS String))
                        WHERE w.username = :username
                        """)
                .setParameter("username", username).executeUpdate();
    }
}
