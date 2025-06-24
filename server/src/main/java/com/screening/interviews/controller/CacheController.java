package com.screening.interviews.controller;

import com.screening.interviews.service.CacheMonitorService;
import com.screening.interviews.service.CacheService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/cache")
@RequiredArgsConstructor
public class CacheController {

    private final CacheMonitorService cacheMonitorService;
    private final CacheService cacheService;

    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getCacheStatistics() {
        return ResponseEntity.ok(cacheMonitorService.getCacheStatistics());
    }

    @PostMapping("/clear")
    public ResponseEntity<String> clearAllCaches() {
        cacheMonitorService.clearAllCaches();
        return ResponseEntity.ok("All caches cleared successfully");
    }

    @PostMapping("/clear/{pattern}")
    public ResponseEntity<String> clearCachePattern(@PathVariable String pattern) {
        cacheService.deletePattern(pattern + "*");
        return ResponseEntity.ok("Cache pattern cleared: " + pattern);
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> getCacheHealth() {
        boolean isAvailable = cacheMonitorService.isRedisAvailable();
        return ResponseEntity.ok(Map.of(
                "status", isAvailable ? "UP" : "DOWN",
                "redis", isAvailable ? "Connected" : "Disconnected"
        ));
    }
}