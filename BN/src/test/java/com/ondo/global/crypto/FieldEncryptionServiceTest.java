package com.ondo.global.crypto;

import com.ondo.global.config.EncryptionProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class FieldEncryptionServiceTest {

    private FieldEncryptionService fieldEncryptionService;

    @BeforeEach
    void setUp() {
        EncryptionProperties properties = new EncryptionProperties();
        properties.setDevMode(true);
        fieldEncryptionService = new FieldEncryptionService(properties);
        fieldEncryptionService.init();
    }

    @Test
    void encryptAndDecrypt_roundTrip() {
        String plain = "01012345678";

        String encrypted = fieldEncryptionService.encrypt(plain);
        String decrypted = fieldEncryptionService.decrypt(encrypted);

        assertThat(encrypted).isNotEqualTo(plain);
        assertThat(decrypted).isEqualTo(plain);
    }
}
