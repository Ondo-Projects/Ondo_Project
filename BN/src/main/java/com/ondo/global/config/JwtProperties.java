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
}
