package com.ondo.domain.counseling.service;

import com.ondo.domain.counseling.entity.CounselingPost;
import com.ondo.domain.counseling.entity.CounselingStatus;
import com.ondo.domain.user.entity.User;
import com.ondo.global.config.OndoAppProperties;
import com.ondo.global.sms.SolapiSmsSender;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class CounselingNotificationService {

    private static final int TITLE_PREVIEW_MAX_LENGTH = 30;

    private final SolapiSmsSender solapiSmsSender;
    private final OndoAppProperties ondoAppProperties;

    public void notifyTeacherNewRequest(CounselingPost post) {
        if (post == null || post.getStatus() != CounselingStatus.WAITING) {
            return;
        }

        User teacher = post.getTeacher();
        if (!canNotifyTeacher(teacher)) {
            return;
        }

        try {
            solapiSmsSender.sendSms(teacher.getPhone(), buildMessage(post));
        } catch (RuntimeException exception) {
            log.warn(
                    "Counseling SMS notification failed: counselingId={}, teacher={}",
                    post.getId(),
                    teacher.getUsername(),
                    exception
            );
        }
    }

    private boolean canNotifyTeacher(User teacher) {
        if (teacher == null) {
            return false;
        }
        if (!teacher.isSmsNotifyEnabled()) {
            return false;
        }
        String phone = teacher.getPhone();
        return phone != null && !phone.isBlank();
    }

    String buildMessage(CounselingPost post) {
        User student = post.getStudent();
        String schoolName = student.getSchool().getSchoolName();
        String studentName = student.getName() != null ? student.getName().trim() : student.getUsername();
        String titlePreview = truncate(post.getTitle(), TITLE_PREVIEW_MAX_LENGTH);
        String teacherUrl = normalizeBaseUrl(ondoAppProperties.getBaseUrl()) + "/teacher";

        return """
                [온도 상담웹]
                %s %s 학생 상담 신청이 접수되었습니다.
                제목: %s
                확인: %s
                """.formatted(schoolName, studentName, titlePreview, teacherUrl).trim();
    }

    private String normalizeBaseUrl(String baseUrl) {
        if (baseUrl == null || baseUrl.isBlank()) {
            return "http://localhost:8081";
        }
        return baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
    }

    private String truncate(String value, int maxLength) {
        if (value == null || value.isBlank()) {
            return "-";
        }
        String trimmed = value.trim();
        if (trimmed.length() <= maxLength) {
            return trimmed;
        }
        return trimmed.substring(0, maxLength) + "...";
    }
}
