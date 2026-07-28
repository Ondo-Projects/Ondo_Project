package com.ondo.domain.mood.dto;

import com.ondo.domain.mood.entity.MoodLevel;
import lombok.Getter;

import java.time.LocalDate;

@Getter
public class DailyMoodRecordDto {

    private final LocalDate date;
    private final MoodLevelDto moodLevel;

    public DailyMoodRecordDto(LocalDate date, MoodLevel moodLevel) {
        this.date = date;
        this.moodLevel = moodLevel != null ? MoodLevelDto.from(moodLevel) : null;
    }
}
