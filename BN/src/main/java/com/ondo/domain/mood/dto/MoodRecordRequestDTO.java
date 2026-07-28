package com.ondo.domain.mood.dto;

import com.ondo.domain.mood.entity.MoodLevel;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MoodRecordRequestDTO {

    @NotNull(message = "오늘의 마음 날씨를 선택해 주세요.")
    private MoodLevel moodLevel;
}
