package com.ondo.domain.admin.dto;

import com.ondo.domain.precounseling.entity.PreCounselingProfileAccessLog;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;

@Getter
@RequiredArgsConstructor
public class AdminPreCounselAccessLogDTO {

    private final Long id;
    private final String studentUsername;
    private final String studentName;
    private final String teacherUsername;
    private final String teacherName;
    private final LocalDateTime accessedAt;

    public static AdminPreCounselAccessLogDTO from(PreCounselingProfileAccessLog log) {
        return new AdminPreCounselAccessLogDTO(
                log.getId(),
                log.getStudent().getUsername(),
                log.getStudent().getName(),
                log.getTeacher().getUsername(),
                log.getTeacher().getName(),
                log.getAccessedAt()
        );
    }
}
