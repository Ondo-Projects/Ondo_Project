package com.ondo.domain.mood.dto;

import com.ondo.domain.mood.entity.MoodLevel;
import lombok.Getter;

@Getter
public class MoodLevelDto {

    private final String code;
    private final String label;
    private final String emoji;

    public MoodLevelDto(String code, String label, String emoji) {
        this.code = code;
        this.label = label;
        this.emoji = emoji;
    }

    public static MoodLevelDto from(MoodLevel moodLevel) {
        return switch (moodLevel) {
            case SUNNY -> new MoodLevelDto("SUNNY", "맑음", "☀️");
            case FAIR -> new MoodLevelDto("FAIR", "보통", "🌤️");
            case CLOUDY -> new MoodLevelDto("CLOUDY", "흐림", "☁️");
            case RAINY -> new MoodLevelDto("RAINY", "우울", "🌧️");
            case STORMY -> new MoodLevelDto("STORMY", "힘듦", "⛈️");
        };
    }
}
