package com.ondo.global.alert;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.after;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.timeout;
import static org.mockito.Mockito.verify;

class OperatorAlertServiceTest {

    private static final ZoneId ZONE = ZoneId.of("Asia/Seoul");

    private OperatorAlertProperties properties;
    private JavaMailSender mailSender;
    private MutableClock clock;

    @BeforeEach
    void setUp() {
        properties = new OperatorAlertProperties();
        properties.setEmail("admin@example.com");
        properties.setCooldownMinutes(30);
        properties.setDailyLimit(3);
        mailSender = mock(JavaMailSender.class);
        clock = new MutableClock(Instant.parse("2026-11-24T01:00:00Z"));
    }

    private OperatorAlertService service(boolean mailDevMode) {
        return new OperatorAlertService(properties, mailSender, mailDevMode, "ondo@example.com", clock);
    }

    @Test
    void sameKey_sentOncePerCooldown() {
        OperatorAlertService service = service(false);

        assertThat(service.shouldSend("a")).isTrue();
        assertThat(service.shouldSend("a")).isFalse();

        clock.advance(Duration.ofMinutes(29));
        assertThat(service.shouldSend("a")).isFalse();

        clock.advance(Duration.ofMinutes(2));
        assertThat(service.shouldSend("a")).isTrue();
    }

    @Test
    void dailyLimit_resetsNextDay() {
        OperatorAlertService service = service(false);

        assertThat(service.shouldSend("a")).isTrue();
        assertThat(service.shouldSend("b")).isTrue();
        assertThat(service.shouldSend("c")).isTrue();
        assertThat(service.shouldSend("d")).isFalse();

        clock.advance(Duration.ofDays(1));
        assertThat(service.shouldSend("d")).isTrue();
    }

    @Test
    void disabled_neverSends() {
        properties.setEnabled(false);
        assertThat(service(false).shouldSend("a")).isFalse();
    }

    @Test
    void serverError_sendsSanitizedMail() {
        OperatorAlertService service = service(false);

        service.notifyServerError(
                new IllegalStateException("Duplicate entry 'kim@school.kr'"),
                "POST",
                "/api/auth/signup?email=kim@school.kr");

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender, timeout(2000)).send(captor.capture());
        SimpleMailMessage message = captor.getValue();
        assertThat(message.getTo()).containsExactly("admin@example.com");
        assertThat(message.getSubject()).isEqualTo("[온도] 서버 오류: IllegalStateException");
        assertThat(message.getText())
                .contains("POST /api/auth/signup")
                .contains("java.lang.IllegalStateException")
                .doesNotContain("kim@school.kr");
    }

    @Test
    void jobFailure_sendsMail() {
        service(false).notifyJobFailure("개인정보 자동 파기", new RuntimeException("db down"));

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender, timeout(2000)).send(captor.capture());
        assertThat(captor.getValue().getSubject()).isEqualTo("[온도] 정기 작업 실패: 개인정보 자동 파기");
    }

    @Test
    void mailDevMode_onlyLogs() {
        service(true).notifyServerError(new IllegalStateException("x"), "GET", "/api/x");

        verify(mailSender, after(300).never()).send(any(SimpleMailMessage.class));
    }

    @Test
    void emptyEmail_onlyLogs() {
        properties.setEmail("");
        service(false).notifyServerError(new IllegalStateException("x"), "GET", "/api/x");

        verify(mailSender, after(300).never()).send(any(SimpleMailMessage.class));
    }

    @Test
    void mailFailure_doesNotThrow() {
        org.mockito.Mockito.doThrow(new org.springframework.mail.MailSendException("smtp down"))
                .when(mailSender).send(any(SimpleMailMessage.class));

        service(false).notifyServerError(new IllegalStateException("x"), "GET", "/api/x");

        verify(mailSender, timeout(2000)).send(any(SimpleMailMessage.class));
    }

    /** 테스트에서 시간을 앞으로 돌리기 위한 시계 */
    private static final class MutableClock extends Clock {
        private Instant now;

        MutableClock(Instant now) {
            this.now = now;
        }

        void advance(Duration duration) {
            now = now.plus(duration);
        }

        @Override
        public ZoneId getZone() {
            return ZONE;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return now;
        }
    }
}
