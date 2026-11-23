package com.ondo.domain.counseling.service;

import com.ondo.domain.counseling.entity.CounselingPost;
import com.ondo.domain.counseling.entity.CounselingStatus;
import com.ondo.domain.counseling.entity.CounselingType;
import com.ondo.domain.user.entity.Role;
import com.ondo.domain.user.entity.User;
import com.ondo.global.config.OndoAppProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

class StudentReplyNotificationServiceTest {

    private JavaMailSender mailSender;
    private OndoAppProperties appProperties;

    @BeforeEach
    void setUp() {
        mailSender = mock(JavaMailSender.class);
        appProperties = new OndoAppProperties();
        appProperties.setBaseUrl("https://ondo.ai.kr/");
    }

    /** 테스트에서는 바로 실행되는 실행기를 써서 결과를 즉시 확인합니다 */
    private StudentReplyNotificationService service(boolean mailDevMode) {
        return new StudentReplyNotificationService(mailSender, appProperties, mailDevMode, "ondo@example.com", Runnable::run);
    }

    @Test
    void sendsLinkOnly_withoutCounselingTitleOrContent() {
        service(false).notifyReplied(post(student("kim@school.kr")));

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());
        SimpleMailMessage message = captor.getValue();
        assertThat(message.getTo()).containsExactly("kim@school.kr");
        assertThat(message.getFrom()).isEqualTo("ondo@example.com");
        assertThat(message.getSubject()).isEqualTo(StudentReplyNotificationService.SUBJECT);
        assertThat(message.getText())
                .contains("https://ondo.ai.kr/student#counsel/")
                .doesNotContain("친구 문제로 고민")
                .doesNotContain("요즘 너무 힘들어요");
    }

    @Test
    void disabledByStudent_doesNotSend() {
        User student = student("kim@school.kr");
        student.updateReplyEmailEnabled(false);

        service(false).notifyReplied(post(student));

        verify(mailSender, never()).send(any(SimpleMailMessage.class));
    }

    @Test
    void noEmail_doesNotSend() {
        service(false).notifyReplied(post(student(null)));

        verify(mailSender, never()).send(any(SimpleMailMessage.class));
    }

    @Test
    void mailDevMode_onlyLogs() {
        service(true).notifyReplied(post(student("kim@school.kr")));

        verify(mailSender, never()).send(any(SimpleMailMessage.class));
    }

    @Test
    void mailFailure_doesNotThrow() {
        doThrow(new MailSendException("smtp down")).when(mailSender).send(any(SimpleMailMessage.class));

        service(false).notifyReplied(post(student("kim@school.kr")));

        verify(mailSender).send(any(SimpleMailMessage.class));
    }

    private User student(String email) {
        return User.builder()
                .username("reply-student")
                .password("encoded")
                .role(Role.STUDENT)
                .name("학생")
                .email(email)
                .agreeService(true)
                .agreePrivacy(true)
                .agreeSensitive(true)
                .agreedAt(LocalDateTime.now())
                .build();
    }

    private CounselingPost post(User student) {
        return CounselingPost.builder()
                .student(student)
                .title("친구 문제로 고민")
                .content("요즘 너무 힘들어요")
                .desiredDate(LocalDate.now().plusDays(1))
                .counselingType(CounselingType.INTERPERSONAL)
                .status(CounselingStatus.CONFIRMED)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }
}
