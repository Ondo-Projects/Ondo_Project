package com.ondo.domain.counseling.repository;

import com.ondo.domain.counseling.entity.CounselingAccessLog;
import com.ondo.domain.counseling.entity.CounselingPost;
import com.ondo.domain.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;

public interface CounselingAccessLogRepository extends JpaRepository<CounselingAccessLog, Long> {

    long countByCounselingPostAndTeacher(CounselingPost counselingPost, User teacher);

    long countByAccessedAtAfter(LocalDateTime accessedAt);

    Page<CounselingAccessLog> findAllByOrderByAccessedAtDesc(Pageable pageable);
}
