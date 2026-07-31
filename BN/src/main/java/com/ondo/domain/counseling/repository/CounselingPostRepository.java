package com.ondo.domain.counseling.repository;

import com.ondo.domain.counseling.entity.CounselingPost;
import com.ondo.domain.counseling.entity.CounselingStatus;
import com.ondo.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface CounselingPostRepository extends JpaRepository<CounselingPost, Long> {

    List<CounselingPost> findByStudentAndDeletedAtIsNullOrderByCreatedAtDesc(User student);

    List<CounselingPost> findByStudentInAndDeletedAtIsNullOrderByCreatedAtDesc(List<User> students);

    List<CounselingPost> findByStudentInAndStatusAndDeletedAtIsNullOrderByCreatedAtDesc(
            List<User> students,
            CounselingStatus status
    );

    Optional<CounselingPost> findByIdAndDeletedAtIsNull(Long id);

    long countByDeletedAtIsNull();

    long countByCreatedAtAfterAndDeletedAtIsNull(LocalDateTime createdAt);

    @Query("""
            SELECT p.status, COUNT(p)
            FROM CounselingPost p
            WHERE p.deletedAt IS NULL
            GROUP BY p.status
            """)
    List<Object[]> countGroupByStatus();

    @Query("""
            SELECT COUNT(p)
            FROM CounselingPost p
            WHERE p.student IN :students
              AND p.deletedAt IS NULL
              AND (p.readByTeacherAt IS NULL OR p.updatedAt > p.readByTeacherAt)
            """)
    long countUnreadByStudents(List<User> students);
}
