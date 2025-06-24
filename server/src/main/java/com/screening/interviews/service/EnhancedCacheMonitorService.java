package com.screening.interviews.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class EnhancedCacheMonitorService {

    private final RedisTemplate<String, Object> redisTemplate;

    public Map<String, Object> getDetailedCacheStatistics() {
        Map<String, Object> stats = new HashMap<>();

        try {
            // Get Redis info
            Properties info = redisTemplate.getConnectionFactory()
                    .getConnection().info();

            // Get all cache keys
            Set<String> allKeys = redisTemplate.keys("*");
            stats.put("totalKeys", allKeys != null ? allKeys.size() : 0);

            // Analyze cache patterns
            Map<String, Object> cacheAnalysis = analyzeCacheKeys(allKeys);
            stats.put("cacheAnalysis", cacheAnalysis);

            // Redis memory info
            if (info != null) {
                stats.put("memoryUsage", info.getProperty("used_memory_human"));
                stats.put("memoryPeak", info.getProperty("used_memory_peak_human"));
                stats.put("totalCommandsProcessed", info.getProperty("total_commands_processed"));
                stats.put("keyspaceHits", info.getProperty("keyspace_hits"));
                stats.put("keyspaceMisses", info.getProperty("keyspace_misses"));

                // Calculate hit ratio from Redis stats
                String hits = info.getProperty("keyspace_hits");
                String misses = info.getProperty("keyspace_misses");
                if (hits != null && misses != null) {
                    long hitCount = Long.parseLong(hits);
                    long missCount = Long.parseLong(misses);
                    long total = hitCount + missCount;
                    double hitRatio = total > 0 ? (double) hitCount / total * 100 : 0;
                    stats.put("hitRatio", String.format("%.2f%%", hitRatio));
                }
            }

            // Sample cache contents
            stats.put("sampleKeys", getSampleCacheContents(allKeys));

        } catch (Exception e) {
            log.error("Error getting detailed cache statistics", e);
            stats.put("error", "Unable to retrieve cache statistics: " + e.getMessage());
        }

        return stats;
    }

    private Map<String, Object> analyzeCacheKeys(Set<String> allKeys) {
        Map<String, Object> analysis = new HashMap<>();

        if (allKeys == null || allKeys.isEmpty()) {
            return analysis;
        }

        // Group by cache type
        Map<String, Long> keysByType = allKeys.stream()
                .collect(Collectors.groupingBy(
                        key -> key.contains(":") ? key.split(":")[0] : "unknown",
                        Collectors.counting()
                ));

        analysis.put("keysByType", keysByType);

        // Find expiring keys
        List<Map<String, Object>> expiringKeys = new ArrayList<>();
        for (String key : allKeys.stream().limit(20).collect(Collectors.toList())) {
            try {
                Long ttl = redisTemplate.getExpire(key);
                if (ttl != null && ttl > 0) {
                    expiringKeys.add(Map.of(
                            "key", key,
                            "ttlSeconds", ttl
                    ));
                }
            } catch (Exception e) {
                log.debug("Error getting TTL for key: {}", key);
            }
        }
        analysis.put("expiringKeys", expiringKeys);

        return analysis;
    }

    private List<Map<String, Object>> getSampleCacheContents(Set<String> allKeys) {
        List<Map<String, Object>> samples = new ArrayList<>();

        if (allKeys == null) return samples;

        // Take first 10 keys as samples
        allKeys.stream().limit(10).forEach(key -> {
            try {
                Object value = redisTemplate.opsForValue().get(key);
                Long ttl = redisTemplate.getExpire(key);

                samples.add(Map.of(
                        "key", key,
                        "type", value != null ? value.getClass().getSimpleName() : "null",
                        "ttl", ttl != null ? ttl : -1,
                        "size", value != null ? value.toString().length() : 0
                ));
            } catch (Exception e) {
                log.debug("Error sampling key: {}", key);
            }
        });

        return samples;
    }
}