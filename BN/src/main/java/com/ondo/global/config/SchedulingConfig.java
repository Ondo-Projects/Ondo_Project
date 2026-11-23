package com.ondo.global.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/** 개인정보 자동 파기(DataRetentionScheduler) 등 정기 작업을 켭니다. */
@Configuration
@EnableScheduling
public class SchedulingConfig {
}
