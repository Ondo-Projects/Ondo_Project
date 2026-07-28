package com.ondo.domain.user.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "ondo.user.legacy-active-fix")
public class UserActiveMigrationProperties {

    /**
     * Step 9-2 active 컬럼 추가 직후, 기존 행이 active=0으로 남은 DB를 1회 보정할 때 사용합니다.
     * 보정 완료 후 false 로 두세요. true 이면 서버 기동마다 비활성 계정을 다시 활성화합니다.
     */
    private boolean enabled = false;
}
