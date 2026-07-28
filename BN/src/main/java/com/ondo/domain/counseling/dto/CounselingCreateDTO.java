package com.ondo.domain.counseling.dto;

import com.ondo.domain.counseling.entity.CounselingType;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class CounselingCreateDTO {

    @NotBlank(message = "제목을 입력해 주세요.")
    @Size(max = 100, message = "제목은 100자 이하여야 합니다.")
    private String title;

    @NotBlank(message = "내용을 입력해 주세요.")
    private String content;

    @NotNull(message = "희망 상담일을 입력해 주세요.")
    @FutureOrPresent(message = "희망 상담일은 오늘 이후 날짜여야 합니다.")
    private LocalDate desiredDate;

    @NotNull(message = "상담 분류를 선택해 주세요.")
    private CounselingType counselingType;
}
