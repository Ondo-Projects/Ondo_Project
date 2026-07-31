package com.ondo.domain.home.support;

import com.ondo.domain.home.dto.HomeSectionResult;
import com.ondo.global.error.BusinessException;
import lombok.extern.slf4j.Slf4j;

import java.util.function.Supplier;

@Slf4j
public final class HomeAggregateSupport {

    private HomeAggregateSupport() {
    }

    public static <T> HomeSectionResult<T> loadSafely(Supplier<T> loader, String fallbackMessage) {
        try {
            return HomeSectionResult.ok(loader.get());
        } catch (BusinessException exception) {
            return HomeSectionResult.fail(exception.getMessage());
        } catch (Exception exception) {
            log.warn("Home aggregate section failed: {}", fallbackMessage, exception);
            return HomeSectionResult.fail(fallbackMessage);
        }
    }
}
