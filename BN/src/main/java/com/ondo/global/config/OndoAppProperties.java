package com.ondo.global.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "ondo.app")
public class OndoAppProperties {

    private String baseUrl = "http://localhost:8081";
}
