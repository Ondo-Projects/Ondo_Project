package com.ondo.domain.assignment.repository;

import com.ondo.domain.assignment.entity.TeacherInviteCode;
import com.ondo.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TeacherInviteCodeRepository extends JpaRepository<TeacherInviteCode, Long> {

    Optional<TeacherInviteCode> findByTeacher(User teacher);

    Optional<TeacherInviteCode> findByCode(String code);

    boolean existsByCode(String code);
}
