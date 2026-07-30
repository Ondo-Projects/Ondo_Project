package com.ondo.domain.counseling.service;

import com.ondo.domain.counseling.entity.CounselingPost;
import com.ondo.domain.counseling.entity.CounselingStatus;
import com.ondo.domain.counseling.entity.CounselingType;
import com.ondo.domain.school.entity.School;
import com.ondo.domain.user.entity.Role;
import com.ondo.domain.user.entity.User;
import com.ondo.global.config.OndoAppProperties;
import com.ondo.global.error.BusinessException;
import com.ondo.global.sms.SolapiSmsSender;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class CounselingNotificationServiceTest {

    @Mock
    private SolapiSmsSender solapiSmsSender;

    private CounselingNotificationService counselingNotificationService;

    private CounselingPost post;
    private User teacher;

    @BeforeEach
    void setUp() {
        OndoAppProperties properties = new OndoAppProperties();
        properties.setBaseUrl("http://localhost:8081");
        counselingNotificationService = new CounselingNotificationService(solapiSmsSender, properties);

        School school = School.builder()
                .schoolCode("CNF001")
                .schoolName("상담알림중학교")
                .region("서울특별시")
                .schoolType("중")
                .build();

        User student = User.builder()
                .username("student01")
                .password("encoded")
                .role(Role.STUDENT)
                .school(school)
                .name("김학생")
                .agreeService(true)
                .agreePrivacy(true)
                .agreeSensitive(true)
                .build();

        teacher = User.builder()
                .username("teacher01")
                .password("encoded")
                .role(Role.TEACHER)
                .school(school)
                .name("박교사")
                .email("teacher01@korea.kr")
                .agreeService(true)
                .agreePrivacy(true)
                .agreeSensitive(true)
                .build();

        post = CounselingPost.builder()
                .student(student)
                .teacher(teacher)
                .title("요즘 마음이 힘들어요")
                .content("민감한 상담 내용")
                .desiredDate(LocalDate.now().plusDays(1))
                .counselingType(CounselingType.EMOTIONAL)
                .status(CounselingStatus.WAITING)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Test
    void notifyTeacherNewRequest_whenReady_sendsSms() {
        teacher.updateNotificationSettings("01012345678", true);

        counselingNotificationService.notifyTeacherNewRequest(post);

        verify(solapiSmsSender).sendSms(
                eq("01012345678"),
                eq("""
                        [온도 상담웹]
                        상담알림중학교 김학생 학생 상담 신청이 접수되었습니다.
                        제목: 요즘 마음이 힘들어요
                        확인: http://localhost:8081/teacher""")
        );
    }

    @Test
    void notifyTeacherNewRequest_withoutConsent_doesNotSend() {
        teacher.updateNotificationSettings("01012345678", false);

        counselingNotificationService.notifyTeacherNewRequest(post);

        verify(solapiSmsSender, never()).sendSms(anyString(), anyString());
    }

    @Test
    void notifyTeacherNewRequest_withoutPhone_doesNotSend() {
        teacher.updateNotificationSettings(null, true);

        counselingNotificationService.notifyTeacherNewRequest(post);

        verify(solapiSmsSender, never()).sendSms(anyString(), anyString());
    }

    @Test
    void notifyTeacherNewRequest_whenSmsFails_doesNotPropagate() {
        teacher.updateNotificationSettings("01012345678", true);
        doThrow(new BusinessException("SMS 발송 중 오류가 발생했습니다."))
                .when(solapiSmsSender)
                .sendSms(anyString(), anyString());

        counselingNotificationService.notifyTeacherNewRequest(post);

        verify(solapiSmsSender).sendSms(eq("01012345678"), anyString());
    }

    @Test
    void buildMessage_doesNotIncludeCounselingContent() {
        teacher.updateNotificationSettings("01012345678", true);

        String message = counselingNotificationService.buildMessage(post);

        assertThat(message).contains("요즘 마음이 힘들어요");
        assertThat(message).doesNotContain("민감한 상담 내용");
        assertThat(message).contains("/teacher");
    }
}
