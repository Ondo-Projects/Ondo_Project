package com.ondo.global.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "ondo.solapi")
public class SolapiProperties {

    private boolean devMode = true;
    private String apiKey = "";
    private String apiSecret = "";
    private String senderPhone = "";
}
