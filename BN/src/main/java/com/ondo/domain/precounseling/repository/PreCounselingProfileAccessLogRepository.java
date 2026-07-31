package com.ondo.domain.precounseling.repository;

import com.ondo.domain.precounseling.entity.PreCounselingProfileAccessLog;
import com.ondo.domain.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;

public interface PreCounselingProfileAccessLogRepository extends JpaRepository<PreCounselingProfileAccessLog, Long> {

    long countByStudentAndTeacher(User student, User teacher);

    long countByAccessedAtAfter(LocalDateTime accessedAt);

    Page<PreCounselingProfileAccessLog> findAllByOrderByAccessedAtDesc(Pageable pageable);
}
