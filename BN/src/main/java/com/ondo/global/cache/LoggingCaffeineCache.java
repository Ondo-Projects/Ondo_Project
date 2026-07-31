package com.ondo.global.cache;

import com.github.benmanes.caffeine.cache.Cache;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.caffeine.CaffeineCache;

@Slf4j
public class LoggingCaffeineCache extends CaffeineCache {

    private final boolean loggingEnabled;

    public LoggingCaffeineCache(String name, Cache<Object, Object> cache, boolean loggingEnabled) {
        super(name, cache);
        this.loggingEnabled = loggingEnabled;
    }

    @Override
    public ValueWrapper get(Object key) {
        ValueWrapper cached = super.get(key);
        logAccess(cached != null, key);
        return cached;
    }

    private void logAccess(boolean hit, Object key) {
        if (!loggingEnabled) {
            return;
        }
        if (hit) {
            log.debug("[cache HIT] {} key={}", getName(), key);
            return;
        }
        log.debug("[cache MISS] {} key={}", getName(), key);
    }
}
