package com.ondo.global.crypto;

import com.ondo.global.config.EncryptionProperties;
import com.ondo.global.error.BusinessException;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

@Service
@RequiredArgsConstructor
public class FieldEncryptionService {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_TAG_LENGTH = 128;
    private static final int IV_LENGTH = 12;

    private final EncryptionProperties encryptionProperties;
    private final SecureRandom secureRandom = new SecureRandom();
    private SecretKeySpec secretKey;

    @PostConstruct
    void init() {
        byte[] keyBytes = resolveKeyBytes();
        if (keyBytes.length != 32) {
            throw new IllegalStateException("ondo.encryption.key must decode to 32 bytes for AES-256.");
        }
        this.secretKey = new SecretKeySpec(keyBytes, "AES");
    }

    public String encrypt(String plainText) {
        if (plainText == null || plainText.isBlank()) {
            return null;
        }
        try {
            byte[] iv = new byte[IV_LENGTH];
            secureRandom.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, new GCMParameterSpec(GCM_TAG_LENGTH, iv));
            byte[] encrypted = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));

            ByteBuffer buffer = ByteBuffer.allocate(iv.length + encrypted.length);
            buffer.put(iv);
            buffer.put(encrypted);
            return Base64.getEncoder().encodeToString(buffer.array());
        } catch (Exception exception) {
            throw new BusinessException("민감 정보 암호화에 실패했습니다.");
        }
    }

    public String decrypt(String cipherText) {
        if (cipherText == null || cipherText.isBlank()) {
            return null;
        }
        try {
            byte[] decoded = Base64.getDecoder().decode(cipherText);
            ByteBuffer buffer = ByteBuffer.wrap(decoded);
            byte[] iv = new byte[IV_LENGTH];
            buffer.get(iv);
            byte[] encrypted = new byte[buffer.remaining()];
            buffer.get(encrypted);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, new GCMParameterSpec(GCM_TAG_LENGTH, iv));
            byte[] plain = cipher.doFinal(encrypted);
            return new String(plain, StandardCharsets.UTF_8);
        } catch (Exception exception) {
            throw new BusinessException("민감 정보 복호화에 실패했습니다.");
        }
    }

    private byte[] resolveKeyBytes() {
        String configuredKey = encryptionProperties.getKey();
        if (configuredKey != null && !configuredKey.isBlank()) {
            try {
                return Base64.getDecoder().decode(configuredKey);
            } catch (IllegalArgumentException exception) {
                byte[] raw = configuredKey.getBytes(StandardCharsets.UTF_8);
                if (raw.length == 32) {
                    return raw;
                }
            }
        }
        if (encryptionProperties.isDevMode()) {
            return "01234567890123456789012345678901".getBytes(StandardCharsets.UTF_8);
        }
        throw new IllegalStateException("ondo.encryption.key is required when dev-mode is disabled.");
    }
}
