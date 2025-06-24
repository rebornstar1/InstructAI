package com.screening.interviews.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.screening.interviews.exception.ResourceNotFoundException;
import com.screening.interviews.model.Module;
import com.screening.interviews.repo.ModuleRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ModuleService {

    private static final Logger logger = LoggerFactory.getLogger(ModuleService.class);
    private static final DateTimeFormatter TIMESTAMP_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final ModuleRepository moduleRepository;
    private final CacheService cacheService;
    private final ObjectMapper objectMapper;

    // Cache TTL configurations
    private static final Duration MODULE_TTL = Duration.ofHours(1);
    private static final Duration MODULE_LIST_TTL = Duration.ofMinutes(30);

    public List<Module> getAllModules() {
        logger.info("Fetching all modules (User: rebornstar1, Time: {})",
                LocalDateTime.now().format(TIMESTAMP_FORMATTER));

        String cacheKey = generateCacheKey("modules:list", "all-modules");

        // Check cache first
        List<Module> cachedResult = getCachedModuleList(cacheKey);
        if (cachedResult != null && !cachedResult.isEmpty()) {
            logger.info("Retrieved {} modules from cache (User: rebornstar1)", cachedResult.size());
            return cachedResult.stream()
                    .map(this::validateAndEnrichModule)
                    .collect(Collectors.toList());
        }

        List<Module> modules = moduleRepository.findAll();
        List<Module> validatedModules = modules.stream()
                .map(this::validateAndEnrichModule)
                .collect(Collectors.toList());

        // Cache the result
        cacheModuleList(cacheKey, validatedModules, MODULE_LIST_TTL);

        logger.info("Fetched {} modules from database and cached (User: rebornstar1)", validatedModules.size());
        return validatedModules;
    }

    public Module getModuleById(Long id) {
        logger.info("Fetching module by ID: {} (User: rebornstar1, Time: {})",
                id, LocalDateTime.now().format(TIMESTAMP_FORMATTER));

        String cacheKey = generateCacheKey("modules:single", String.valueOf(id));

        // Check cache first
        Module cachedResult = getCachedModule(cacheKey);
        if (cachedResult != null) {
            logger.info("Retrieved module {} from cache (User: rebornstar1)", id);
            return validateAndEnrichModule(cachedResult);
        }

        Module module = moduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Module not found with id: " + id));

        Module validatedModule = validateAndEnrichModule(module);

        // Cache the result
        cacheModule(cacheKey, validatedModule, MODULE_TTL);

        logger.info("Fetched module {} from database and cached (User: rebornstar1)", id);
        return validatedModule;
    }

    public Module updateModuleKeyTerms(Long id, List<String> keyTerms, List<String> definitions) {
        logger.info("Updating key terms for module {} (User: rebornstar1, Time: {})",
                id, LocalDateTime.now().format(TIMESTAMP_FORMATTER));

        Module module = getModuleById(id);

        // Validate input data
        List<String> validatedKeyTerms = keyTerms != null ?
                keyTerms.stream().filter(Objects::nonNull).collect(Collectors.toList()) :
                Collections.emptyList();

        List<String> validatedDefinitions = definitions != null ?
                definitions.stream().filter(Objects::nonNull).collect(Collectors.toList()) :
                Collections.emptyList();

        // Update the key terms and definitions
        module.setKeyTerms(validatedKeyTerms);
        module.setDefinitions(validatedDefinitions);

        // Save the updated module
        Module savedModule = moduleRepository.save(module);
        Module validatedModule = validateAndEnrichModule(savedModule);

        // Clear related caches and update with new data
        clearModuleRelatedCaches(id);

        // Cache the updated module
        String cacheKey = generateCacheKey("modules:single", String.valueOf(id));
        cacheModule(cacheKey, validatedModule, MODULE_TTL);

        logger.info("Updated key terms for module {} and refreshed cache (User: rebornstar1, " +
                        "KeyTerms: {}, Definitions: {})",
                id, validatedKeyTerms.size(), validatedDefinitions.size());

        return validatedModule;
    }

    public Module saveModule(Module module) {
        logger.info("Saving module: {} (User: rebornstar1, Time: {})",
                module.getTitle() != null ? module.getTitle() : "New Module",
                LocalDateTime.now().format(TIMESTAMP_FORMATTER));

        // Validate module before saving
        Module validatedModule = validateAndEnrichModule(module);

        Module savedModule = moduleRepository.save(validatedModule);
        Module finalValidatedModule = validateAndEnrichModule(savedModule);

        // Clear related caches
        clearModuleRelatedCaches(savedModule.getId());

        // Cache the new/updated module if it has an ID
        if (savedModule.getId() != null) {
            String cacheKey = generateCacheKey("modules:single", String.valueOf(savedModule.getId()));
            cacheModule(cacheKey, finalValidatedModule, MODULE_TTL);

            logger.info("Saved module with ID {} and cached (User: rebornstar1)", savedModule.getId());
        } else {
            logger.info("Saved module without ID (User: rebornstar1)");
        }

        return finalValidatedModule;
    }

    public void deleteModule(Long id) {
        logger.info("Deleting module with ID: {} (User: rebornstar1, Time: {})",
                id, LocalDateTime.now().format(TIMESTAMP_FORMATTER));

        moduleRepository.deleteById(id);

        // Clear related caches
        clearModuleRelatedCaches(id);

        logger.info("Deleted module {} and cleared related caches (User: rebornstar1)", id);
    }

    public void clearModuleCaches() {
        try {
            cacheService.deletePattern("modules:*");
            logger.info("Cleared all module caches successfully (User: rebornstar1, Time: {})",
                    LocalDateTime.now().format(TIMESTAMP_FORMATTER));
        } catch (Exception e) {
            logger.error("Error clearing module caches: {} (User: rebornstar1)", e.getMessage());
        }
    }

    // Manual caching helper methods
    private String generateCacheKey(String prefix, String... parts) {
        return prefix + ":" + String.join(":", parts);
    }

    private Module getCachedModule(String cacheKey) {
        try {
            Object cachedObject = cacheService.get(cacheKey);
            if (cachedObject == null) {
                return null;
            }

            // Handle different cached object types
            if (cachedObject instanceof Module) {
                logger.debug("Retrieved Module directly from cache: {} (User: rebornstar1)", cacheKey);
                return (Module) cachedObject;
            } else if (cachedObject instanceof String) {
                // Try to deserialize from JSON string
                logger.debug("Deserializing Module from JSON string: {} (User: rebornstar1)", cacheKey);
                return objectMapper.readValue((String) cachedObject, Module.class);
            } else if (cachedObject instanceof Map) {
                // Convert Map to Module
                logger.debug("Converting Map to Module: {} (User: rebornstar1)", cacheKey);
                String jsonString = objectMapper.writeValueAsString(cachedObject);
                return objectMapper.readValue(jsonString, Module.class);
            } else {
                logger.warn("Unexpected cached object type: {} for key: {} (User: rebornstar1)",
                        cachedObject.getClass(), cacheKey);
                cacheService.delete(cacheKey);
                return null;
            }
        } catch (Exception e) {
            logger.warn("Failed to retrieve/deserialize cached module for key: {}, error: {} (User: rebornstar1)",
                    cacheKey, e.getMessage());
            cacheService.delete(cacheKey);
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    private List<Module> getCachedModuleList(String cacheKey) {
        try {
            Object cachedObject = cacheService.get(cacheKey);
            if (cachedObject == null) {
                return null;
            }

            if (cachedObject instanceof List) {
                List<?> cachedList = (List<?>) cachedObject;
                return cachedList.stream()
                        .map(item -> {
                            try {
                                if (item instanceof Module) {
                                    return (Module) item;
                                } else if (item instanceof Map) {
                                    String jsonString = objectMapper.writeValueAsString(item);
                                    return objectMapper.readValue(jsonString, Module.class);
                                } else {
                                    return null;
                                }
                            } catch (Exception e) {
                                logger.warn("Failed to convert list item: {} (User: rebornstar1)", e.getMessage());
                                return null;
                            }
                        })
                        .filter(Objects::nonNull)
                        .collect(Collectors.toList());
            } else {
                logger.warn("Unexpected cached list type: {} for key: {} (User: rebornstar1)",
                        cachedObject.getClass(), cacheKey);
                cacheService.delete(cacheKey);
                return null;
            }
        } catch (Exception e) {
            logger.warn("Failed to retrieve/deserialize cached module list for key: {}, error: {} (User: rebornstar1)",
                    cacheKey, e.getMessage());
            cacheService.delete(cacheKey);
            return null;
        }
    }

    private void cacheModule(String cacheKey, Module module, Duration ttl) {
        try {
            // Validate the module before caching
            String jsonString = objectMapper.writeValueAsString(module);

            // Verify it can be deserialized back correctly
            Module testDeserialize = objectMapper.readValue(jsonString, Module.class);

            if (testDeserialize != null && testDeserialize.getTitle() != null) {
                cacheService.set(cacheKey, module, ttl);
                logger.debug("Successfully cached module for key: {} (User: rebornstar1)", cacheKey);
            } else {
                logger.warn("Module failed validation, not caching: {} (User: rebornstar1)", cacheKey);
            }
        } catch (JsonProcessingException e) {
            logger.error("Failed to serialize module for caching: {} (User: rebornstar1)", e.getMessage());
        } catch (Exception e) {
            logger.warn("Failed to cache module for key: {}: {} (User: rebornstar1)", cacheKey, e.getMessage());
        }
    }

    private void cacheModuleList(String cacheKey, List<Module> moduleList, Duration ttl) {
        try {
            // Validate the list before caching
            String jsonString = objectMapper.writeValueAsString(moduleList);

            // Verify it can be deserialized back correctly
            List<?> testDeserialize = objectMapper.readValue(jsonString, List.class);

            if (testDeserialize != null) {
                cacheService.set(cacheKey, moduleList, ttl);
                logger.debug("Successfully cached module list with {} items for key: {} (User: rebornstar1)",
                        moduleList.size(), cacheKey);
            } else {
                logger.warn("Module list failed validation, not caching: {} (User: rebornstar1)", cacheKey);
            }
        } catch (JsonProcessingException e) {
            logger.error("Failed to serialize module list for caching: {} (User: rebornstar1)", e.getMessage());
        } catch (Exception e) {
            logger.warn("Failed to cache module list for key: {}: {} (User: rebornstar1)", cacheKey, e.getMessage());
        }
    }

    private void clearModuleRelatedCaches(Long moduleId) {
        try {
            // Clear specific module cache
            if (moduleId != null) {
                String specificModuleKey = generateCacheKey("modules:single", String.valueOf(moduleId));
                cacheService.delete(specificModuleKey);
            }

            // Clear module list cache
            String moduleListKey = generateCacheKey("modules:list", "all-modules");
            cacheService.delete(moduleListKey);

            logger.info("Cleared module-related caches for module {} (User: rebornstar1)", moduleId);
        } catch (Exception e) {
            logger.error("Error clearing module-related caches for module {}: {} (User: rebornstar1)",
                    moduleId, e.getMessage());
        }
    }

    /**
     * Validates and enriches the Module to ensure proper JSON format for frontend
     */
    private Module validateAndEnrichModule(Module module) {
        if (module == null) {
            return null;
        }

        try {
            // Ensure all list fields are never null
            if (module.getLearningObjectives() == null) {
                module.setLearningObjectives(Collections.emptyList());
            }
            if (module.getKeyTerms() == null) {
                module.setKeyTerms(Collections.emptyList());
            }
            if (module.getDefinitions() == null) {
                module.setDefinitions(Collections.emptyList());
            }

            // Ensure string fields are never null
            if (module.getModuleId() == null) {
                module.setModuleId("M" + System.currentTimeMillis() % 1000);
            }
            if (module.getTitle() == null) {
                module.setTitle("Untitled Module");
            }
            if (module.getDescription() == null) {
                module.setDescription("Module description not available");
            }
            if (module.getDuration() == null) {
                module.setDuration("30 minutes");
            }
            if (module.getComplexityLevel() == null) {
                module.setComplexityLevel("Basic");
            }

            // Remove any null entries from lists
            if (module.getLearningObjectives() != null) {
                module.setLearningObjectives(
                        module.getLearningObjectives().stream()
                                .filter(Objects::nonNull)
                                .collect(Collectors.toList())
                );
            }

            if (module.getKeyTerms() != null) {
                module.setKeyTerms(
                        module.getKeyTerms().stream()
                                .filter(Objects::nonNull)
                                .collect(Collectors.toList())
                );
            }

            if (module.getDefinitions() != null) {
                module.setDefinitions(
                        module.getDefinitions().stream()
                                .filter(Objects::nonNull)
                                .collect(Collectors.toList())
                );
            }

            // Validate JSON serialization
            String jsonString = objectMapper.writeValueAsString(module);
            Module validated = objectMapper.readValue(jsonString, Module.class);

            logger.debug("Module validation successful for: {} at {} (User: rebornstar1)",
                    module.getTitle(), LocalDateTime.now().format(TIMESTAMP_FORMATTER));

            return validated;

        } catch (Exception e) {
            logger.error("Failed to validate/enrich module: {} (User: rebornstar1)", e.getMessage());
            return module; // Return original if validation fails
        }
    }

    // Additional utility methods for module operations
    public List<Module> getModulesByCourseId(Long courseId) {
        logger.info("Fetching modules for course ID: {} (User: rebornstar1, Time: {})",
                courseId, LocalDateTime.now().format(TIMESTAMP_FORMATTER));

        String cacheKey = generateCacheKey("modules:course", String.valueOf(courseId));

        // Check cache first
        List<Module> cachedResult = getCachedModuleList(cacheKey);
        if (cachedResult != null) {
            logger.info("Retrieved {} modules for course {} from cache (User: rebornstar1)",
                    cachedResult.size(), courseId);
            return cachedResult.stream()
                    .map(this::validateAndEnrichModule)
                    .collect(Collectors.toList());
        }

        List<Module> modules = moduleRepository.findByCourseId(courseId);
        List<Module> validatedModules = modules.stream()
                .map(this::validateAndEnrichModule)
                .collect(Collectors.toList());

        // Cache the result
        cacheModuleList(cacheKey, validatedModules, MODULE_TTL);

        logger.info("Fetched {} modules for course {} from database and cached (User: rebornstar1)",
                validatedModules.size(), courseId);
        return validatedModules;
    }

    public void clearModuleCachesByCourseId(Long courseId) {
        try {
            String courseModulesKey = generateCacheKey("modules:course", String.valueOf(courseId));
            cacheService.delete(courseModulesKey);

            // Also clear the all modules list cache since it might include these modules
            String moduleListKey = generateCacheKey("modules:list", "all-modules");
            cacheService.delete(moduleListKey);

            logger.info("Cleared module caches for course {} (User: rebornstar1)", courseId);
        } catch (Exception e) {
            logger.error("Error clearing module caches for course {}: {} (User: rebornstar1)",
                    courseId, e.getMessage());
        }
    }

    public Module findByModuleId(String moduleId) {
        logger.info("Finding module by moduleId: {} (User: rebornstar1, Time: {})",
                moduleId, LocalDateTime.now().format(TIMESTAMP_FORMATTER));

        String cacheKey = generateCacheKey("modules:moduleId", moduleId);

        // Check cache first
        Module cachedResult = getCachedModule(cacheKey);
        if (cachedResult != null) {
            logger.info("Retrieved module {} from cache by moduleId (User: rebornstar1)", moduleId);
            return validateAndEnrichModule(cachedResult);
        }

        Optional<Module> moduleOpt = moduleRepository.findByModuleId(moduleId);
        if (moduleOpt.isPresent()) {
            Module module = validateAndEnrichModule(moduleOpt.get());

            // Cache the result
            cacheModule(cacheKey, module, MODULE_TTL);

            logger.info("Found module {} by moduleId and cached (User: rebornstar1)", moduleId);
            return module;
        } else {
            logger.warn("Module not found with moduleId: {} (User: rebornstar1)", moduleId);
            throw new ResourceNotFoundException("Module not found with moduleId: " + moduleId);
        }
    }
}