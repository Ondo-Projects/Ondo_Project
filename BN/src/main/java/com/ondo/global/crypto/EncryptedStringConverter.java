package com.ondo.global.crypto;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * DB에는 AES-256-GCM 암호문으로 저장하고, 코드에서는 평문으로 다루게 해 주는 변환기.
 * 같은 값도 저장할 때마다 암호문이 달라지므로, 이 칸으로 검색(WHERE)하면 안 됩니다.
 */
@Slf4j
@Component
@Converter
@RequiredArgsConstructor
public class EncryptedStringConverter implements AttributeConverter<String, String> {

    private final FieldEncryptionService fieldEncryptionService;

    @Override
    public String convertToDatabaseColumn(String plainText) {
        if (plainText == null || plainText.isBlank()) {
            return null;
        }
        return fieldEncryptionService.encrypt(plainText);
    }

    @Override
    public String convertToEntityAttribute(String cipherText) {
        if (cipherText == null || cipherText.isBlank()) {
            return null;
        }
        try {
            return fieldEncryptionService.decrypt(cipherText);
        } catch (RuntimeException exception) {
            // 복호화에 실패해도 로그인 등 다른 기능이 멈추지 않도록 빈 값으로 둡니다. (키 설정을 확인해야 함)
            log.error("[암호화] 저장된 값을 복호화하지 못했습니다. ondo.encryption.key 설정을 확인하세요.");
            return null;
        }
    }
}
