package com.ondo.domain.counseling.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CounselingReplyDTO {

    @NotBlank(message = "답변 내용을 입력해 주세요.")
    private String reply;
}
