package com.screening.interviews.controller;

import com.screening.interviews.service.CacheMetricsService;
import com.screening.interviews.service.PerformanceMetricsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/metrics")
@RequiredArgsConstructor
public class MetricsController {

    private final CacheMetricsService cacheMetricsService;
    private final PerformanceMetricsService performanceMetricsService;

    @GetMapping("/cache")
    public Map<String, Object> getCacheMetrics() {
        return cacheMetricsService.getCacheStatistics();
    }

    @GetMapping("/performance")
    public Map<String, Object> getPerformanceMetrics() {
        return performanceMetricsService.getPerformanceStats();
    }

    @GetMapping("/summary")
    public Map<String, Object> getMetricsSummary() {
        return Map.of(
                "cache", cacheMetricsService.getCacheStatistics(),
                "performance", performanceMetricsService.getPerformanceStats(),
                "timestamp", System.currentTimeMillis()
        );
    }
}