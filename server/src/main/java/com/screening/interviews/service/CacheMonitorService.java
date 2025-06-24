package com.screening.interviews.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class CacheMonitorService {

    private final RedisTemplate<String, Object> redisTemplate;

    public Map<String, Object> getCacheStatistics() {
        Map<String, Object> stats = new HashMap<>();

        try {
            // Get all cache keys by pattern
            Set<String> allKeys = redisTemplate.keys("*");
            stats.put("totalKeys", allKeys != null ? allKeys.size() : 0);

            // Count keys by cache type
            Map<String, Integer> keysByType = new HashMap<>();
            if (allKeys != null) {
                for (String key : allKeys) {
                    String type = key.split(":")[0];
                    keysByType.put(type, keysByType.getOrDefault(type, 0) + 1);
                }
            }
            stats.put("keysByType", keysByType);

            // Memory usage (if available)
            stats.put("memoryUsage", "Available via Redis INFO command");

        } catch (Exception e) {
            log.error("Error getting cache statistics", e);
            stats.put("error", "Unable to retrieve cache statistics");
        }

        return stats;
    }

    public void clearAllCaches() {
        try {
            Set<String> keys = redisTemplate.keys("*");
            if (keys != null && !keys.isEmpty()) {
                redisTemplate.delete(keys);
                log.info("Cleared {} cache keys", keys.size());
            }
        } catch (Exception e) {
            log.error("Error clearing all caches", e);
        }
    }

    public boolean isRedisAvailable() {
        try {
            redisTemplate.opsForValue().get("health-check");
            return true;
        } catch (Exception e) {
            log.error("Redis is not available", e);
            return false;
        }
    }
}