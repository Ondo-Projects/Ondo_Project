package com.ondo.domain.suggestion.dto;

import com.ondo.domain.suggestion.entity.SuggestionCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SuggestionCreateDTO {

    @NotNull(message = "건의 분류를 선택해 주세요.")
    private SuggestionCategory category;

    @NotBlank(message = "제목을 입력해 주세요.")
    @Size(max = 100, message = "제목은 100자 이하여야 합니다.")
    private String title;

    @NotBlank(message = "내용을 입력해 주세요.")
    @Size(max = 2000, message = "내용은 2000자 이하여야 합니다.")
    private String content;
}
