package com.ondo.global.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

/**
 * spring.mail.host 가 없을 때 JavaMailSender 빈을 제공한다.
 * ondo.mail.dev-mode=true 일 때만 사용한다.
 * dev-mode=false(실제 SMTP) 이면 Spring Boot MailAutoConfiguration 이 spring.mail.* 를 적용해야 하므로
 * 이 fallback 을 등록하면 localhost:25 로 고정되어 운영 메일 발송이 실패한다.
 */
@Configuration
@ConditionalOnProperty(name = "ondo.mail.dev-mode", havingValue = "true", matchIfMissing = true)
public class FallbackMailSenderConfig {

    @Bean
    @ConditionalOnMissingBean(JavaMailSender.class)
    public JavaMailSender fallbackJavaMailSender() {
        JavaMailSenderImpl sender = new JavaMailSenderImpl();
        sender.setHost("localhost");
        sender.setPort(25);
        sender.setUsername("ondo@ondo.local");
        return sender;
    }
}
