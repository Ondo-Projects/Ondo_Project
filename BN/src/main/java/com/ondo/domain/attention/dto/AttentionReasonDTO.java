package com.ondo.domain.attention.dto;

import lombok.Getter;

@Getter
public class AttentionReasonDTO {

    private final AttentionReasonCode code;
    private final String message;
    /** SCHOOL_VIOLENCE_OPEN 일 때 해당 상담 글 번호 */
    private final Long counselingPostId;

    public AttentionReasonDTO(AttentionReasonCode code, String message, Long counselingPostId) {
        this.code = code;
        this.message = message;
        this.counselingPostId = counselingPostId;
    }
}
