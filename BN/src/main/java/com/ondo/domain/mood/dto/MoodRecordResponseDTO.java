package com.ondo.domain.mood.dto;

import com.ondo.domain.mood.dto.MoodLevelDto;
import com.ondo.domain.mood.entity.MoodRecord;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
public class MoodRecordResponseDTO {

    private final MoodLevelDto moodLevel;
    private final LocalDate recordedDate;
    private final LocalDateTime updatedAt;

    public MoodRecordResponseDTO(MoodRecord record) {
        this.moodLevel = MoodLevelDto.from(record.getMoodLevel());
        this.recordedDate = record.getRecordedDate();
        this.updatedAt = record.getUpdatedAt();
    }
}
