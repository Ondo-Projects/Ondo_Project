package com.ondo.domain.attention.dto;

import lombok.Getter;

import java.util.List;

@Getter
public class StudentAttentionResponseDTO {

    private final String studentUsername;
    private final String studentName;
    /** 오늘 '힘듦'이나 학교폭력 상담이 있으면 true — 목록 맨 위에 둡니다 */
    private final boolean urgent;
    private final List<AttentionReasonDTO> reasons;

    public StudentAttentionResponseDTO(
            String studentUsername,
            String studentName,
            boolean urgent,
            List<AttentionReasonDTO> reasons
    ) {
        this.studentUsername = studentUsername;
        this.studentName = studentName;
        this.urgent = urgent;
        this.reasons = reasons;
    }
}
