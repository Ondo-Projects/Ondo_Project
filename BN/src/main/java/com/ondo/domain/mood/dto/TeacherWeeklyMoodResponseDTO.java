package com.ondo.domain.mood.dto;

import lombok.Getter;

import java.time.LocalDate;
import java.util.List;

@Getter
public class TeacherWeeklyMoodResponseDTO {

    private final LocalDate startDate;
    private final LocalDate endDate;
    private final int totalRecords;
    private final List<MoodCountDto> moodCounts;
    private final List<StudentWeeklyMoodResponseDTO> students;

    public TeacherWeeklyMoodResponseDTO(
            LocalDate startDate,
            LocalDate endDate,
            int totalRecords,
            List<MoodCountDto> moodCounts,
            List<StudentWeeklyMoodResponseDTO> students
    ) {
        this.startDate = startDate;
        this.endDate = endDate;
        this.totalRecords = totalRecords;
        this.moodCounts = moodCounts;
        this.students = students;
    }
}
