package com.ondo.global.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "ondo.neis")
public class NeisProperties {

    private boolean devMode = false;
    private String apiKey = "";
    private String baseUrl = "https://open.neis.go.kr/hub";
}
