package com.ondo.domain.suggestion.dto;

import com.ondo.domain.suggestion.entity.SuggestionStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SuggestionStatusUpdateDTO {

    @NotNull(message = "처리 상태를 선택해 주세요.")
    private SuggestionStatus status;
}
