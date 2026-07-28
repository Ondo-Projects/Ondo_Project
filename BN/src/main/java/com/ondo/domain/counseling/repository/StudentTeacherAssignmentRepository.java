package com.ondo.domain.counseling.repository;

import com.ondo.domain.counseling.entity.StudentTeacherAssignment;
import com.ondo.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface StudentTeacherAssignmentRepository extends JpaRepository<StudentTeacherAssignment, Long> {

    Optional<StudentTeacherAssignment> findByStudent(User student);

    @Query("""
            SELECT a FROM StudentTeacherAssignment a
            JOIN FETCH a.teacher t
            JOIN FETCH t.school
            WHERE a.student = :student
            """)
    Optional<StudentTeacherAssignment> findByStudentWithDetails(@Param("student") User student);

    List<StudentTeacherAssignment> findByTeacher(User teacher);
}
