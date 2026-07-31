package com.ondo.global.cache;

import org.junit.jupiter.api.Test;
import org.springframework.cache.CacheManager;

import static org.assertj.core.api.Assertions.assertThat;

class ExternalApiCacheConfigTest {

    @Test
    void cacheManager_registersExternalApiCaches() {
        ExternalApiCacheProperties properties = new ExternalApiCacheProperties();
        properties.setWeatherTtlMinutes(15);
        properties.setNeisTtlMinutes(30);
        properties.setLoggingEnabled(false);

        ExternalApiCacheConfig config = new ExternalApiCacheConfig();
        CacheManager cacheManager = config.cacheManager(properties);

        assertThat(cacheManager.getCache(CacheNames.WEATHER_TODAY)).isNotNull();
        assertThat(cacheManager.getCache(CacheNames.NEIS_MEALS)).isNotNull();
        assertThat(cacheManager.getCache(CacheNames.NEIS_SCHEDULE)).isNotNull();
        assertThat(cacheManager.getCache(CacheNames.NEIS_TIMETABLE)).isNotNull();
    }
}
