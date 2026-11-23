package com.ondo.global.crypto;

import com.ondo.global.config.EncryptionProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

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

    private static final String REAL_KEY = "q83vEjRWeJq83vEjRWeJq83vEjRWeJq83vEjRWeJq8M=";

    private FieldEncryptionService service(boolean devMode, String key, boolean migrateFromDevKey) {
        EncryptionProperties properties = new EncryptionProperties();
        properties.setDevMode(devMode);
        properties.setKey(key);
        properties.setMigrateFromDevKey(migrateFromDevKey);
        FieldEncryptionService encryptionService = new FieldEncryptionService(properties);
        encryptionService.init();
        return encryptionService;
    }

    @Test
    void init_rejectsMalformedKeyInsteadOfFallingBackToDevKey() {
        assertThatThrownBy(() -> service(true, "not-a-valid-key", false))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void init_requiresKeyWhenDevModeDisabled() {
        assertThatThrownBy(() -> service(false, "", false))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void migrateFromDevKey_readsAndReencryptsLegacyValues() {
        String legacy = fieldEncryptionService.encrypt("01012345678");
        FieldEncryptionService current = service(false, REAL_KEY, true);

        assertThat(current.isUsingDevKey()).isFalse();
        assertThat(current.decrypt(legacy)).isEqualTo("01012345678");

        String reencrypted = current.reencryptFromDevKey(legacy);
        assertThat(reencrypted).isNotNull();
        assertThat(current.reencryptFromDevKey(reencrypted)).isNull();

        FieldEncryptionService withoutFallback = service(false, REAL_KEY, false);
        assertThat(withoutFallback.decrypt(reencrypted)).isEqualTo("01012345678");
        assertThatThrownBy(() -> withoutFallback.decrypt(legacy))
                .isInstanceOf(com.ondo.global.error.BusinessException.class);
    }
}
