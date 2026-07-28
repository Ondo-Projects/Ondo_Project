package com.ondo.domain.mood.dto;

import com.ondo.domain.mood.entity.MoodLevel;
import com.ondo.domain.mood.entity.MoodRecord;
import com.ondo.domain.user.entity.User;
import lombok.Getter;

import java.time.LocalDate;

@Getter
public class StudentMoodSummaryResponseDTO {

    private final String studentUsername;
    private final String studentName;
    private final MoodLevelDto moodLevel;
    private final LocalDate recordedDate;

    public StudentMoodSummaryResponseDTO(String studentUsername, String studentName, MoodLevel moodLevel, LocalDate recordedDate) {
        this.studentUsername = studentUsername;
        this.studentName = studentName;
        this.moodLevel = moodLevel != null ? MoodLevelDto.from(moodLevel) : null;
        this.recordedDate = recordedDate;
    }

    public static StudentMoodSummaryResponseDTO from(User student, MoodRecord record) {
        return new StudentMoodSummaryResponseDTO(
                student.getUsername(),
                student.getName(),
                record.getMoodLevel(),
                record.getRecordedDate()
        );
    }

    public static StudentMoodSummaryResponseDTO withoutRecord(User student, LocalDate recordedDate) {
        return new StudentMoodSummaryResponseDTO(student.getUsername(), student.getName(), null, recordedDate);
    }
}
