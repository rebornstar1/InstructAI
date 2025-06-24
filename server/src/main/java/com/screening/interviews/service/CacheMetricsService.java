package com.screening.interviews.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Service;
import org.springframework.cache.support.SimpleValueWrapper;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Service
@Slf4j
public class CacheMetricsService {

    private final CacheManager cacheManager;
    private final Map<String, AtomicLong> cacheHits = new ConcurrentHashMap<>();
    private final Map<String, AtomicLong> cacheMisses = new ConcurrentHashMap<>();
    private final Map<String, AtomicLong> cacheEvictions = new ConcurrentHashMap<>();

    public CacheMetricsService(CacheManager cacheManager) {
        this.cacheManager = cacheManager;
    }

    public void recordCacheHit(String cacheName) {
        cacheHits.computeIfAbsent(cacheName, k -> new AtomicLong(0)).incrementAndGet();
        log.debug("Cache HIT for cache: {}", cacheName);
    }

    public void recordCacheMiss(String cacheName) {
        cacheMisses.computeIfAbsent(cacheName, k -> new AtomicLong(0)).incrementAndGet();
        log.debug("Cache MISS for cache: {}", cacheName);
    }

    public double getCacheHitRatio(String cacheName) {
        long hits = cacheHits.getOrDefault(cacheName, new AtomicLong(0)).get();
        long misses = cacheMisses.getOrDefault(cacheName, new AtomicLong(0)).get();
        long total = hits + misses;

        return total > 0 ? (double) hits / total : 0.0;
    }

    public Map<String, Object> getCacheStatistics() {
        Map<String, Object> stats = new ConcurrentHashMap<>();

        cacheManager.getCacheNames().forEach(cacheName -> {
            Cache cache = cacheManager.getCache(cacheName);
            if (cache != null) {
                long hits = cacheHits.getOrDefault(cacheName, new AtomicLong(0)).get();
                long misses = cacheMisses.getOrDefault(cacheName, new AtomicLong(0)).get();
                double hitRatio = getCacheHitRatio(cacheName);

                Map<String, Object> cacheStats = Map.of(
                        "hits", hits,
                        "misses", misses,
                        "hitRatio", String.format("%.2f%%", hitRatio * 100),
                        "totalRequests", hits + misses
                );

                stats.put(cacheName, cacheStats);
            }
        });

        return stats;
    }
}