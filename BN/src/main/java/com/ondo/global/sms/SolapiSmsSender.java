package com.ondo.global.sms;

import com.ondo.global.config.SolapiProperties;
import com.ondo.global.error.BusinessException;
import com.solapi.sdk.SolapiClient;
import com.solapi.sdk.message.model.Message;
import com.solapi.sdk.message.service.DefaultMessageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class SolapiSmsSender {

    private final SolapiProperties properties;

    public void sendSms(String phone, String content) {
        String normalizedPhone = SmsPhoneUtils.normalizePhone(phone);
        SmsPhoneUtils.validatePhone(normalizedPhone);

        if (properties.isDevMode()) {
            log.info("[DEV][SOLAPI] SMS to {} : {}", normalizedPhone, content);
            return;
        }

        validateConfig();

        try {
            DefaultMessageService messageService = SolapiClient.INSTANCE.createInstance(
                    properties.getApiKey(),
                    properties.getApiSecret()
            );

            Message message = new Message();
            message.setFrom(SmsPhoneUtils.normalizePhone(properties.getSenderPhone()));
            message.setTo(normalizedPhone);
            message.setText(content);

            messageService.send(message);
        } catch (BusinessException exception) {
            throw exception;
        } catch (Exception exception) {
            log.error("Solapi SMS send failed", exception);
            throw new BusinessException("SMS 발송 중 오류가 발생했습니다.");
        }
    }

    private void validateConfig() {
        if (properties.getApiKey().isBlank()
                || properties.getApiSecret().isBlank()
                || properties.getSenderPhone().isBlank()) {
            throw new BusinessException("SMS 서비스 설정이 완료되지 않았습니다.");
        }
    }
}
