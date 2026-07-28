package com.ondo.domain.notice.repository;

import com.ondo.domain.notice.entity.TeacherNotice;
import com.ondo.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TeacherNoticeRepository extends JpaRepository<TeacherNotice, Long> {

    List<TeacherNotice> findByTeacherOrderByCreatedAtDesc(User teacher);
}
