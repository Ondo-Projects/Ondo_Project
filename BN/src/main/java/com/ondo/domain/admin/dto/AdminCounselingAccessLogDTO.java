package com.ondo.domain.admin.dto;

import com.ondo.domain.counseling.entity.CounselingAccessLog;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;

@Getter
@RequiredArgsConstructor
public class AdminCounselingAccessLogDTO {

    private final Long id;
    private final Long counselingPostId;
    private final String counselingTitle;
    private final String studentUsername;
    private final String studentName;
    private final String teacherUsername;
    private final String teacherName;
    private final LocalDateTime accessedAt;

    public static AdminCounselingAccessLogDTO from(CounselingAccessLog log) {
        return new AdminCounselingAccessLogDTO(
                log.getId(),
                log.getCounselingPost().getId(),
                log.getCounselingPost().getTitle(),
                log.getCounselingPost().getStudent().getUsername(),
                log.getCounselingPost().getStudent().getName(),
                log.getTeacher().getUsername(),
                log.getTeacher().getName(),
                log.getAccessedAt()
        );
    }
}
