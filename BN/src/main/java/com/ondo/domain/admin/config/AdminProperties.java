package com.ondo.domain.admin.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "ondo.admin.bootstrap")
public class AdminProperties {

    private boolean enabled = false;
    private String username = "admin";
    private String password = "";
    private String name = "시스템관리자";
}
