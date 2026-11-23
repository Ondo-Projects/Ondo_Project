package com.ondo.domain.counseling.service;

import com.ondo.domain.counseling.entity.CounselingPost;
import com.ondo.domain.user.entity.User;
import com.ondo.global.config.OndoAppProperties;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.concurrent.Executor;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * 담임이 상담에 처음 답변하면 학생에게 메일로 알립니다.
 * - 상담 제목·내용은 민감할 수 있어 메일에 넣지 않고, 확인할 주소만 보냅니다.
 * - 답변이 DB에 확정된 뒤(커밋 후) 별도 스레드에서 보내므로, 교사 화면이 느려지거나 실패하지 않습니다.
 * - 학생이 알림을 끄거나 메일이 없으면 보내지 않습니다. 메일 개발 모드에서는 로그만 남깁니다.
 */
@Service
@Slf4j
public class StudentReplyNotificationService {

    static final String SUBJECT = "[온도] 담임 선생님이 상담에 답변했어요";

    private final JavaMailSender mailSender;
    private final OndoAppProperties appProperties;
    private final boolean mailDevMode;
    private final String mailFrom;
    private final Executor executor;

    @Autowired
    public StudentReplyNotificationService(
            JavaMailSender mailSender,
            OndoAppProperties appProperties,
            @Value("${ondo.mail.dev-mode:true}") boolean mailDevMode,
            @Value("${spring.mail.username:ondo@ondo.local}") String mailFrom
    ) {
        this(mailSender, appProperties, mailDevMode, mailFrom, Executors.newSingleThreadExecutor(runnable -> {
            Thread thread = new Thread(runnable, "student-reply-mail");
            thread.setDaemon(true);
            return thread;
        }));
    }

    StudentReplyNotificationService(
            JavaMailSender mailSender,
            OndoAppProperties appProperties,
            boolean mailDevMode,
            String mailFrom,
            Executor executor
    ) {
        this.mailSender = mailSender;
        this.appProperties = appProperties;
        this.mailDevMode = mailDevMode;
        this.mailFrom = mailFrom;
        this.executor = executor;
    }

    public void notifyReplied(CounselingPost post) {
        User student = post.getStudent();
        if (student == null || !student.isActive() || !student.isReplyEmailEnabled()) {
            return;
        }
        String to = student.getEmail();
        if (to == null || to.isBlank()) {
            return;
        }
        String body = buildBody(post.getId());

        Runnable send = () -> executor.execute(() -> sendNow(to.trim(), body));
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    send.run();
                }
            });
        } else {
            send.run();
        }
    }

    String buildBody(Long postId) {
        return """
                안녕하세요, 온도입니다.

                담임 선생님이 상담 신청에 답변을 남겼어요.
                아래 주소에서 로그인한 뒤 확인해 주세요.

                %s

                상담 내용은 개인정보 보호를 위해 메일에 담지 않습니다.
                이 알림은 온도의 '내 정보 > 알림 설정'에서 끌 수 있어요.
                """.formatted(baseUrl() + "/student#counsel/" + postId);
    }

    private void sendNow(String to, String body) {
        if (mailDevMode) {
            log.info("[reply-mail] 메일 개발 모드 — 학생 답변 알림을 보내지 않고 로그만 남깁니다.");
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(mailFrom);
            message.setTo(to);
            message.setSubject(SUBJECT);
            message.setText(body);
            mailSender.send(message);
        } catch (RuntimeException exception) {
            log.warn("[reply-mail] 학생 답변 알림 메일 발송 실패: {}", exception.getClass().getSimpleName());
        }
    }

    private String baseUrl() {
        String baseUrl = appProperties.getBaseUrl();
        if (baseUrl == null || baseUrl.isBlank()) {
            return "https://ondo.ai.kr";
        }
        return baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
    }

    @PreDestroy
    void shutdown() {
        if (executor instanceof ExecutorService service) {
            service.shutdown();
        }
    }
}
