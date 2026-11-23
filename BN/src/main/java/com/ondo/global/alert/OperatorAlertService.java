package com.ondo.global.alert;

import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

/**
 * 서버 오류, 자동 파기 실패 같은 운영 문제를 운영자 메일로 알립니다.
 * - 알림 때문에 원래 요청이 느려지거나 실패하지 않도록 별도 스레드에서 보내고, 예외를 밖으로 던지지 않습니다.
 * - 같은 오류는 cooldownMinutes 안에 한 번만, 하루 dailyLimit 건까지만 보냅니다.
 * - 메일에는 오류 종류와 코드 위치만 담고, 메시지는 개인정보를 가린 뒤 넣습니다.
 */
@Service
@Slf4j
public class OperatorAlertService {

    private static final ZoneId ZONE = ZoneId.of("Asia/Seoul");
    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final int MAX_APP_FRAMES = 6;

    private final OperatorAlertProperties properties;
    private final JavaMailSender mailSender;
    private final boolean mailDevMode;
    private final String mailFrom;
    private final Clock clock;
    private final ExecutorService executor = Executors.newSingleThreadExecutor(runnable -> {
        Thread thread = new Thread(runnable, "operator-alert");
        thread.setDaemon(true);
        return thread;
    });

    private final Map<String, Instant> lastSentByKey = new ConcurrentHashMap<>();
    private final AtomicInteger sentToday = new AtomicInteger();
    private volatile LocalDate countingDate;

    @Autowired
    public OperatorAlertService(
            OperatorAlertProperties properties,
            JavaMailSender mailSender,
            @Value("${ondo.mail.dev-mode:true}") boolean mailDevMode,
            @Value("${spring.mail.username:ondo@ondo.local}") String mailFrom
    ) {
        this(properties, mailSender, mailDevMode, mailFrom, Clock.system(ZONE));
    }

    OperatorAlertService(
            OperatorAlertProperties properties,
            JavaMailSender mailSender,
            boolean mailDevMode,
            String mailFrom,
            Clock clock
    ) {
        this.properties = properties;
        this.mailSender = mailSender;
        this.mailDevMode = mailDevMode;
        this.mailFrom = mailFrom;
        this.clock = clock;
        this.countingDate = LocalDate.now(clock);
    }

    /** 처리되지 않은 API 오류 알림 */
    public void notifyServerError(Exception exception, String method, String requestUri) {
        String location = firstAppFrame(exception);
        String key = "server-error:" + exception.getClass().getName() + "@" + location;
        String body = """
                처리되지 않은 서버 오류가 발생했습니다. 사용자는 '서버 오류' 안내를 받았습니다.

                요청: %s %s
                오류 종류: %s
                메시지: %s

                코드 위치:
                %s
                """.formatted(
                method,
                AlertTextSanitizer.pathOnly(requestUri),
                exception.getClass().getName(),
                AlertTextSanitizer.sanitize(exception.getMessage()),
                appFrames(exception));
        send(key, "[온도] 서버 오류: " + exception.getClass().getSimpleName(), body);
    }

    /** 정기 작업(자동 파기 등) 실패 알림 */
    public void notifyJobFailure(String jobName, Exception exception) {
        String key = "job:" + jobName + ":" + exception.getClass().getName();
        String body = """
                정기 작업이 실패했습니다. 다음 실행 때 다시 시도합니다.
                같은 알림이 계속 오면 서버 로그를 확인해 주세요.

                작업: %s
                오류 종류: %s
                메시지: %s

                코드 위치:
                %s
                """.formatted(
                jobName,
                exception.getClass().getName(),
                AlertTextSanitizer.sanitize(exception.getMessage()),
                appFrames(exception));
        send(key, "[온도] 정기 작업 실패: " + jobName, body);
    }

    /** 보낼지 판단하고, 보낸다면 true. 테스트에서 직접 확인할 수 있게 패키지 공개입니다. */
    boolean shouldSend(String key) {
        if (!properties.isEnabled()) {
            return false;
        }
        LocalDate today = LocalDate.now(clock);
        if (!today.equals(countingDate)) {
            countingDate = today;
            sentToday.set(0);
        }
        Instant now = clock.instant();
        Instant last = lastSentByKey.get(key);
        if (last != null && last.plusSeconds(properties.getCooldownMinutes() * 60L).isAfter(now)) {
            return false;
        }
        if (sentToday.get() >= properties.getDailyLimit()) {
            return false;
        }
        lastSentByKey.put(key, now);
        sentToday.incrementAndGet();
        return true;
    }

    private void send(String key, String subject, String body) {
        try {
            if (!shouldSend(key)) {
                return;
            }
            String to = properties.getEmail();
            String fullBody = body + "\n발생 시각: " + LocalDateTime.now(clock).format(TIME) + " (KST)\n";
            if (to == null || to.isBlank() || mailDevMode) {
                log.warn("[alert] 운영자 알림(메일 미발송 — ondo.alert.email 미설정 또는 메일 개발 모드)\n{}\n{}", subject, fullBody);
                return;
            }
            executor.execute(() -> {
                try {
                    SimpleMailMessage message = new SimpleMailMessage();
                    message.setFrom(mailFrom);
                    message.setTo(to.trim());
                    message.setSubject(subject);
                    message.setText(fullBody);
                    mailSender.send(message);
                } catch (RuntimeException mailError) {
                    log.error("[alert] 운영자 알림 메일 발송 실패: {}", mailError.getClass().getSimpleName());
                }
            });
        } catch (RuntimeException unexpected) {
            // 알림 실패가 원래 처리에 영향을 주면 안 됩니다.
            log.error("[alert] 운영자 알림 준비 실패", unexpected);
        }
    }

    static String firstAppFrame(Throwable throwable) {
        return Arrays.stream(throwable.getStackTrace())
                .filter(frame -> frame.getClassName().startsWith("com.ondo"))
                .findFirst()
                .map(frame -> frame.getClassName() + ":" + frame.getLineNumber())
                .orElse("unknown");
    }

    static String appFrames(Throwable throwable) {
        String frames = Arrays.stream(throwable.getStackTrace())
                .filter(frame -> frame.getClassName().startsWith("com.ondo"))
                .limit(MAX_APP_FRAMES)
                .map(frame -> "  at " + frame.getClassName() + "." + frame.getMethodName() + ":" + frame.getLineNumber())
                .collect(Collectors.joining("\n"));
        return frames.isEmpty() ? "  (온도 코드 밖에서 발생)" : frames;
    }

    @PreDestroy
    void shutdown() {
        executor.shutdown();
    }
}
