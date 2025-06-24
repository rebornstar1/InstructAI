package com.screening.interviews.service;

import com.screening.interviews.exception.ResourceNotFoundException;
import com.screening.interviews.model.Module;
import com.screening.interviews.repo.ModuleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ModuleService {

    private final ModuleRepository moduleRepository;
    private final CacheService cacheService;

    @Cacheable(value = "modules", key = "'all-modules'", unless = "#result == null || #result.isEmpty()")
    public List<Module> getAllModules() {
        return moduleRepository.findAll();
    }

    @Cacheable(value = "modules", key = "#id", unless = "#result == null")
    public Module getModuleById(Long id) {
        return moduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Module not found with id: " + id));
    }

    @Caching(
            put = @CachePut(value = "modules", key = "#id"),
            evict = @CacheEvict(value = "modules", key = "'all-modules'")
    )
    public Module updateModuleKeyTerms(Long id, List<String> keyTerms, List<String> definitions) {
        Module module = getModuleById(id);

        // Update the key terms and definitions
        module.setKeyTerms(keyTerms);
        module.setDefinitions(definitions);

        // Save and return the updated module
        Module savedModule = moduleRepository.save(module);

        // Update cache manually for better control
        String cacheKey = "modules:" + id;
        cacheService.set(cacheKey, savedModule, Duration.ofHours(1));

        return savedModule;
    }

    @Caching(
            put = @CachePut(value = "modules", key = "#result.id", condition = "#result != null"),
            evict = @CacheEvict(value = "modules", key = "'all-modules'")
    )
    public Module saveModule(Module module) {
        Module savedModule = moduleRepository.save(module);

        // Cache for 1 hour
        if (savedModule.getId() != null) {
            String cacheKey = "modules:" + savedModule.getId();
            cacheService.set(cacheKey, savedModule, Duration.ofHours(1));
        }

        return savedModule;
    }

    @Caching(
            evict = {
                    @CacheEvict(value = "modules", key = "#id"),
                    @CacheEvict(value = "modules", key = "'all-modules'")
            }
    )
    public void deleteModule(Long id) {
        moduleRepository.deleteById(id);
    }

    public void clearModuleCaches() {
        cacheService.deletePattern("modules:*");
    }
}