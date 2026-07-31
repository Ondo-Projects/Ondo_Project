package com.ondo.domain.mood.repository;

import com.ondo.domain.mood.entity.MoodRecord;
import com.ondo.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface MoodRecordRepository extends JpaRepository<MoodRecord, Long> {

    Optional<MoodRecord> findByStudentAndRecordedDate(User student, LocalDate recordedDate);

    List<MoodRecord> findByStudentInAndRecordedDateOrderByStudentUsernameAsc(List<User> students, LocalDate recordedDate);

    List<MoodRecord> findByStudentInAndRecordedDateBetweenOrderByStudentUsernameAscRecordedDateAsc(
            List<User> students,
            LocalDate startDate,
            LocalDate endDate
    );

    @Query("""
            SELECT m.moodLevel, COUNT(m)
            FROM MoodRecord m
            WHERE m.recordedDate >= :since
            GROUP BY m.moodLevel
            """)
    List<Object[]> countGroupByMoodLevelSince(@Param("since") LocalDate since);
}
