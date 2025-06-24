package com.screening.interviews.aspect;

import com.screening.interviews.service.PerformanceMetricsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class PerformanceTrackingAspect {

    private final PerformanceMetricsService performanceMetricsService;

    @Around("@annotation(org.springframework.cache.annotation.Cacheable)")
    public Object trackCacheableMethod(ProceedingJoinPoint joinPoint) throws Throwable {
        String methodName = joinPoint.getSignature().toShortString();
        long startTime = System.currentTimeMillis();

        try {
            Object result = joinPoint.proceed();
            long endTime = System.currentTimeMillis();
            long duration = endTime - startTime;

            performanceMetricsService.recordRequest(methodName, duration);
            log.info("Cacheable method {} executed in {}ms", methodName, duration);

            return result;
        } catch (Exception e) {
            long endTime = System.currentTimeMillis();
            long duration = endTime - startTime;
            performanceMetricsService.recordRequest(methodName + "_ERROR", duration);
            throw e;
        }
    }
}