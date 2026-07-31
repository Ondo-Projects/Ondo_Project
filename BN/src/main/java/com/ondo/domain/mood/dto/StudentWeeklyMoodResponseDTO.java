package com.ondo.domain.mood.dto;

import lombok.Getter;

import java.util.List;

@Getter
public class StudentWeeklyMoodResponseDTO {

    private final String studentUsername;
    private final String studentName;
    private final int recordCount;
    private final List<DailyMoodRecordDto> dailyRecords;

    public StudentWeeklyMoodResponseDTO(
            String studentUsername,
            String studentName,
            int recordCount,
            List<DailyMoodRecordDto> dailyRecords
    ) {
        this.studentUsername = studentUsername;
        this.studentName = studentName;
        this.recordCount = recordCount;
        this.dailyRecords = dailyRecords;
    }
}
