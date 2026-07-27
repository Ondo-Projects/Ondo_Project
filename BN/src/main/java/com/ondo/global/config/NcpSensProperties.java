package com.ondo.global.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "ondo.ncp.sens")
public class NcpSensProperties {

    private boolean devMode = true;
    private String accessKey = "";
    private String secretKey = "";
    private String serviceId = "";
    private String senderPhone = "";
    private String apiUrl = "https://sens.apigw.ntruss.com";
}
