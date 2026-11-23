package com.ondo.global.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "ondo.jwt")
public class JwtProperties {

    private String secret = "";
    private long accessTokenExpiration = 3_600_000L;
    private long refreshTokenExpiration = 604_800_000L;

    /**
     * 토큰 쿠키에 Secure 속성을 붙일지 여부. 운영(HTTPS)은 반드시 true.
     * http://localhost 개발에서 쿠키가 저장되지 않는 브라우저(Safari 등)를 쓸 때만 false.
     */
    private boolean cookieSecure = true;
}
