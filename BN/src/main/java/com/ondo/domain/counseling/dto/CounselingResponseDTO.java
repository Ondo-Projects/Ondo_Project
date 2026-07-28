package com.ondo.domain.counseling.dto;

import com.ondo.domain.counseling.entity.CounselingPost;
import com.ondo.domain.counseling.entity.CounselingStatus;
import com.ondo.domain.counseling.entity.CounselingType;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
public class CounselingResponseDTO {

    private final Long id;
    private final String title;
    private final String content;
    private final LocalDate desiredDate;
    private final CounselingType counselingType;
    private final CounselingStatus status;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;
    private final String studentUsername;
    private final String studentName;
    private final String teacherUsername;
    private final String teacherName;
    private final LocalDateTime readByTeacherAt;
    private final String teacherReply;
    private final LocalDateTime repliedAt;

    public CounselingResponseDTO(CounselingPost post) {
        this.id = post.getId();
        this.title = post.getTitle();
        this.content = post.getContent();
        this.desiredDate = post.getDesiredDate();
        this.counselingType = post.getCounselingType();
        this.status = post.getStatus();
        this.createdAt = post.getCreatedAt();
        this.updatedAt = post.getUpdatedAt();
        this.studentUsername = post.getStudent().getUsername();
        this.studentName = post.getStudent().getName();
        this.teacherUsername = post.getTeacher().getUsername();
        this.teacherName = post.getTeacher().getName();
        this.readByTeacherAt = post.getReadByTeacherAt();
        this.teacherReply = post.getTeacherReply();
        this.repliedAt = post.getRepliedAt();
    }
}
