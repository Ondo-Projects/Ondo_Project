package com.ondo.domain.mood.dto;

import com.ondo.domain.mood.entity.MoodLevel;
import lombok.Getter;

@Getter
public class MoodCountDto {

    private final String code;
    private final String label;
    private final String emoji;
    private final long count;

    public MoodCountDto(MoodLevel moodLevel, long count) {
        MoodLevelDto dto = MoodLevelDto.from(moodLevel);
        this.code = dto.getCode();
        this.label = dto.getLabel();
        this.emoji = dto.getEmoji();
        this.count = count;
    }
}
