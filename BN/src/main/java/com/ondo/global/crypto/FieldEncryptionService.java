package com.ondo.global.crypto;

import com.ondo.global.config.EncryptionProperties;
import com.ondo.global.error.BusinessException;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Base64;

@Slf4j
@Service
@RequiredArgsConstructor
public class FieldEncryptionService {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_TAG_LENGTH = 128;
    private static final int IV_LENGTH = 12;

    /**
     * 로컬 개발 전용 키. 코드에 공개돼 있으므로 운영 데이터 보호에 쓰면 안 됩니다.
     * 예전 운영 데이터가 이 키로 암호화돼 있을 수 있어, 마이그레이션 때 복호화용으로만 사용합니다.
     */
    private static final byte[] DEV_KEY_BYTES = "01234567890123456789012345678901".getBytes(StandardCharsets.UTF_8);

    private final EncryptionProperties encryptionProperties;
    private final SecureRandom secureRandom = new SecureRandom();
    private SecretKeySpec secretKey;
    private SecretKeySpec devKey;
    private boolean usingDevKey;

    @PostConstruct
    void init() {
        byte[] keyBytes = resolveKeyBytes();
        if (keyBytes.length != 32) {
            throw new IllegalStateException("ondo.encryption.key must decode to 32 bytes for AES-256.");
        }
        this.secretKey = new SecretKeySpec(keyBytes, "AES");
        this.devKey = new SecretKeySpec(DEV_KEY_BYTES, "AES");
        this.usingDevKey = Arrays.equals(keyBytes, DEV_KEY_BYTES);

        if (usingDevKey) {
            log.warn("암호화에 공개된 개발용 키를 사용 중입니다. 운영에서는 ondo.encryption.key 를 설정하고 dev-mode=false 로 두세요.");
        }
        if (encryptionProperties.isMigrateFromDevKey()) {
            log.warn("ondo.encryption.migrate-from-dev-key=true — 개발용 키로 암호화된 값도 읽습니다. 재암호화가 끝나면 false 로 바꾸세요.");
        }
    }

    public String encrypt(String plainText) {
        if (plainText == null || plainText.isBlank()) {
            return null;
        }
        try {
            return encryptWith(secretKey, plainText);
        } catch (Exception exception) {
            throw new BusinessException("민감 정보 암호화에 실패했습니다.");
        }
    }

    public String decrypt(String cipherText) {
        if (cipherText == null || cipherText.isBlank()) {
            return null;
        }
        try {
            return decryptWith(secretKey, cipherText);
        } catch (Exception exception) {
            if (canFallbackToDevKey()) {
                try {
                    return decryptWith(devKey, cipherText);
                } catch (Exception ignored) {
                    // 아래에서 공통 오류로 처리
                }
            }
            throw new BusinessException("민감 정보 복호화에 실패했습니다.");
        }
    }

    /**
     * 개발용 키로 암호화된 값을 현재 키로 다시 암호화합니다.
     *
     * @return 새 암호문. 이미 현재 키로 암호화돼 있거나 값이 비어 있으면 null
     * @throws IllegalStateException 어떤 키로도 복호화할 수 없을 때
     */
    public String reencryptFromDevKey(String cipherText) {
        if (cipherText == null || cipherText.isBlank() || usingDevKey) {
            return null;
        }
        try {
            decryptWith(secretKey, cipherText);
            return null;
        } catch (Exception notCurrentKey) {
            try {
                String plain = decryptWith(devKey, cipherText);
                return encryptWith(secretKey, plain);
            } catch (Exception exception) {
                throw new IllegalStateException("현재 키와 개발용 키 모두로 복호화할 수 없는 값입니다.", exception);
            }
        }
    }

    public boolean isUsingDevKey() {
        return usingDevKey;
    }

    private boolean canFallbackToDevKey() {
        return encryptionProperties.isMigrateFromDevKey() && !usingDevKey;
    }

    private String encryptWith(SecretKeySpec key, String plainText) throws Exception {
        byte[] iv = new byte[IV_LENGTH];
        secureRandom.nextBytes(iv);

        Cipher cipher = Cipher.getInstance(ALGORITHM);
        cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(GCM_TAG_LENGTH, iv));
        byte[] encrypted = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));

        ByteBuffer buffer = ByteBuffer.allocate(iv.length + encrypted.length);
        buffer.put(iv);
        buffer.put(encrypted);
        return Base64.getEncoder().encodeToString(buffer.array());
    }

    private String decryptWith(SecretKeySpec key, String cipherText) throws Exception {
        byte[] decoded = Base64.getDecoder().decode(cipherText);
        ByteBuffer buffer = ByteBuffer.wrap(decoded);
        byte[] iv = new byte[IV_LENGTH];
        buffer.get(iv);
        byte[] encrypted = new byte[buffer.remaining()];
        buffer.get(encrypted);

        Cipher cipher = Cipher.getInstance(ALGORITHM);
        cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(GCM_TAG_LENGTH, iv));
        byte[] plain = cipher.doFinal(encrypted);
        return new String(plain, StandardCharsets.UTF_8);
    }

    private byte[] resolveKeyBytes() {
        String configuredKey = encryptionProperties.getKey();
        if (configuredKey != null && !configuredKey.isBlank()) {
            String trimmed = configuredKey.trim();
            try {
                byte[] decoded = Base64.getDecoder().decode(trimmed);
                if (decoded.length == 32) {
                    return decoded;
                }
            } catch (IllegalArgumentException ignored) {
                // Base64 가 아니면 32바이트 원문 키인지 확인
            }
            byte[] raw = trimmed.getBytes(StandardCharsets.UTF_8);
            if (raw.length == 32) {
                return raw;
            }
            // 키를 넣었는데 형식이 틀리면 개발용 키로 몰래 바꾸지 않고 기동을 멈춤
            throw new IllegalStateException(
                    "ondo.encryption.key 형식이 올바르지 않습니다. `openssl rand -base64 32` 로 만든 값(44자)을 넣으세요.");
        }
        if (encryptionProperties.isDevMode()) {
            return DEV_KEY_BYTES.clone();
        }
        throw new IllegalStateException("ondo.encryption.key is required when dev-mode is disabled.");
    }
}
