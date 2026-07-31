package com.ondo.domain.assignment.dto;

import com.ondo.domain.assignment.entity.TeacherInviteCode;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class InviteCodeResponseDTO {

    private final String code;
    private final LocalDateTime createdAt;

    public InviteCodeResponseDTO(TeacherInviteCode inviteCode) {
        this.code = inviteCode.getCode();
        this.createdAt = inviteCode.getCreatedAt();
    }
}
