package com.ondo.domain.mood.entity;

import com.ondo.domain.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "mood_records",
        uniqueConstraints = @UniqueConstraint(columnNames = {"student_username", "recorded_date"})
)
@Getter
@NoArgsConstructor
public class MoodRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_username", nullable = false)
    private User student;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MoodLevel moodLevel;

    @Column(nullable = false)
    private LocalDate recordedDate;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @Builder
    public MoodRecord(User student, MoodLevel moodLevel, LocalDate recordedDate, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.student = student;
        this.moodLevel = moodLevel;
        this.recordedDate = recordedDate;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public void update(MoodLevel moodLevel) {
        this.moodLevel = moodLevel;
        this.updatedAt = LocalDateTime.now();
    }
}
