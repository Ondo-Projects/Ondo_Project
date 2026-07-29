package com.ondo.domain.suggestion.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SuggestionReplyDTO {

    @NotBlank(message = "답변 내용을 입력해 주세요.")
    @Size(max = 2000, message = "답변은 2000자 이하여야 합니다.")
    private String reply;
}
