package com.ondo.global.cache;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "ondo.cache.external")
public class ExternalApiCacheProperties {

    private int weatherTtlMinutes = 15;
    private int neisTtlMinutes = 30;
    private boolean loggingEnabled = true;
}
