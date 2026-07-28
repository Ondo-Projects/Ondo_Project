package com.ondo.domain.counseling.dto;

import com.ondo.domain.counseling.entity.CounselingStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CounselingStatusUpdateDTO {

    @NotNull(message = "상담 상태를 선택해 주세요.")
    private CounselingStatus status;
}
