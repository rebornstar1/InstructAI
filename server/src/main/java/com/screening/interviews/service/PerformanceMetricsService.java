package com.screening.interviews.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.LongAdder;

@Service
@Slf4j
public class PerformanceMetricsService {

    private final Map<String, LongAdder> requestCounts = new ConcurrentHashMap<>();
    private final Map<String, AtomicLong> totalResponseTimes = new ConcurrentHashMap<>();
    private final Map<String, AtomicLong> maxResponseTimes = new ConcurrentHashMap<>();
    private final Map<String, AtomicLong> minResponseTimes = new ConcurrentHashMap<>();

    public void recordRequest(String endpoint, long responseTimeMs) {
        requestCounts.computeIfAbsent(endpoint, k -> new LongAdder()).increment();
        totalResponseTimes.computeIfAbsent(endpoint, k -> new AtomicLong(0)).addAndGet(responseTimeMs);

        // Update max response time
        maxResponseTimes.computeIfAbsent(endpoint, k -> new AtomicLong(0))
                .updateAndGet(current -> Math.max(current, responseTimeMs));

        // Update min response time
        minResponseTimes.computeIfAbsent(endpoint, k -> new AtomicLong(Long.MAX_VALUE))
                .updateAndGet(current -> Math.min(current, responseTimeMs));

        log.info("Request to {} took {}ms", endpoint, responseTimeMs);
    }

    public Map<String, Object> getPerformanceStats() {
        Map<String, Object> stats = new ConcurrentHashMap<>();

        requestCounts.forEach((endpoint, count) -> {
            long requests = count.sum();
            long totalTime = totalResponseTimes.getOrDefault(endpoint, new AtomicLong(0)).get();
            long maxTime = maxResponseTimes.getOrDefault(endpoint, new AtomicLong(0)).get();
            long minTime = minResponseTimes.getOrDefault(endpoint, new AtomicLong(Long.MAX_VALUE)).get();

            if (minTime == Long.MAX_VALUE) minTime = 0;

            double avgTime = requests > 0 ? (double) totalTime / requests : 0;

            Map<String, Object> endpointStats = Map.of(
                    "totalRequests", requests,
                    "averageResponseTime", String.format("%.2fms", avgTime),
                    "maxResponseTime", maxTime + "ms",
                    "minResponseTime", minTime + "ms",
                    "totalResponseTime", totalTime + "ms"
            );

            stats.put(endpoint, endpointStats);
        });

        return stats;
    }
}