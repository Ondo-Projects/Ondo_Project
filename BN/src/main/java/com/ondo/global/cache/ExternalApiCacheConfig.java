package com.ondo.global.cache;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.support.SimpleCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;
import java.util.List;

@Configuration
@EnableCaching
@EnableConfigurationProperties(ExternalApiCacheProperties.class)
public class ExternalApiCacheConfig {

    @Bean
    public CacheManager cacheManager(ExternalApiCacheProperties properties) {
        SimpleCacheManager manager = new SimpleCacheManager();
        manager.setCaches(List.of(
                buildCache(CacheNames.WEATHER_TODAY, properties.getWeatherTtlMinutes(), properties),
                buildCache(CacheNames.NEIS_MEALS, properties.getNeisTtlMinutes(), properties),
                buildCache(CacheNames.NEIS_SCHEDULE, properties.getNeisTtlMinutes(), properties),
                buildCache(CacheNames.NEIS_TIMETABLE, properties.getNeisTtlMinutes(), properties)
        ));
        manager.initializeCaches();
        return manager;
    }

    private Cache buildCache(String name, long ttlMinutes, ExternalApiCacheProperties properties) {
        com.github.benmanes.caffeine.cache.Cache<Object, Object> caffeine = Caffeine.newBuilder()
                .expireAfterWrite(Duration.ofMinutes(ttlMinutes))
                .maximumSize(500)
                .recordStats()
                .build();
        return new LoggingCaffeineCache(name, caffeine, properties.isLoggingEnabled());
    }
}
