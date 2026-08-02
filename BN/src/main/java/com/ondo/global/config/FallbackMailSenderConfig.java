package com.ondo.global.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

/**
 * spring.mail.host 가 없을 때 JavaMailSender 빈을 제공한다.
 * ondo.mail.dev-mode=true 이면 실제 발송은 하지 않지만, 메일 서비스 빈 주입은 필요하다.
 */
@Configuration
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
