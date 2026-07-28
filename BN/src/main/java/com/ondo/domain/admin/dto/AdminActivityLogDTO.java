package com.ondo.domain.admin.dto;

import com.ondo.domain.admin.entity.AdminActivityLog;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;

@Getter
@RequiredArgsConstructor
public class AdminActivityLogDTO {

    private final Long id;
    private final String adminUsername;
    private final String action;
    private final String targetUsername;
    private final String detail;
    private final LocalDateTime createdAt;

    public static AdminActivityLogDTO from(AdminActivityLog log) {
        return new AdminActivityLogDTO(
                log.getId(),
                log.getAdminUsername(),
                log.getAction(),
                log.getTargetUsername(),
                log.getDetail(),
                log.getCreatedAt()
        );
    }
}
