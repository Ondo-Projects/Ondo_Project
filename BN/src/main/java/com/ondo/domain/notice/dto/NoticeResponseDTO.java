package com.ondo.domain.notice.dto;

import com.ondo.domain.notice.entity.TeacherNotice;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class NoticeResponseDTO {

    private final Long id;
    private final String title;
    private final String content;
    private final String teacherUsername;
    private final String teacherName;
    private final LocalDateTime createdAt;

    public NoticeResponseDTO(TeacherNotice notice) {
        this.id = notice.getId();
        this.title = notice.getTitle();
        this.content = notice.getContent();
        this.teacherUsername = notice.getTeacher().getUsername();
        this.teacherName = notice.getTeacher().getName();
        this.createdAt = notice.getCreatedAt();
    }
}
