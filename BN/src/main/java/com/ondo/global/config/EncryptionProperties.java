package com.ondo.global.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "ondo.encryption")
public class EncryptionProperties {

    private boolean devMode = true;

    private String key = "";

    /**
     * 개발용 키로 암호화된 기존 데이터를 새 키로 옮길 때 1회 true.
     * true 이면 기동 시 재암호화를 실행하고, 그동안 개발용 키로 된 값도 읽습니다.
     * 재암호화 로그를 확인한 뒤 false 로 바꾸세요.
     */
    private boolean migrateFromDevKey = false;
}
