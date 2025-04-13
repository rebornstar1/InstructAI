package com.screening.interviews.controller;

import com.screening.interviews.dto.*;
import com.screening.interviews.model.Module;
import com.screening.interviews.service.ModuleContentService;
import com.screening.interviews.service.ModuleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/modules")
@CrossOrigin(origins = "*")
public class ModuleController {

    private final ModuleService moduleService;
    private final ModuleContentService moduleContentService;

    @Autowired
    public ModuleController(ModuleService moduleService, ModuleContentService moduleContentService) {
        this.moduleService = moduleService;
        this.moduleContentService = moduleContentService;
    }

    /**
     * Get all modules
     */
    @GetMapping
    public ResponseEntity<List<Module>> getAllModules() {
        return ResponseEntity.ok(moduleService.getAllModules());
    }

    /**
     * Get a specific module by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Module> getModuleById(@PathVariable Long id) {
        return ResponseEntity.ok(moduleService.getModuleById(id));
    }

    /**
     * Update key terms for a module
     */
    @PutMapping("/{id}/key-terms")
    public ResponseEntity<Module> updateModuleKeyTerms(
            @PathVariable Long id,
            @RequestBody KeyTermsUpdateDto request) {
        return ResponseEntity.ok(moduleService.updateModuleKeyTerms(id, request.getKeyTerms(), request.getDefinitions()));
    }

    /**
     * Generate content for a key term
     */
    @PostMapping("/term/generate")
    public ResponseEntity<TermContentResponseDto> generateTermContent(
            @RequestBody TermContentRequestDto request) {
        // Default saveContent to true if not specified
        if (request.getSaveContent() == null) {
            request.setSaveContent(true);
        }

        TermContentResponseDto response = moduleContentService.generateTermContent(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Extract key terms for a module
     */
    @PostMapping("/key-terms/extract")
    public ResponseEntity<KeyTermResponseDto> extractKeyTerms(
            @RequestBody KeyTermRequestDto request) {
        KeyTermResponseDto response = moduleContentService.extractTheKeyTerms(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Save a module (create or update)
     */
    @PostMapping
    public ResponseEntity<Module> saveModule(@RequestBody Module module) {
        return ResponseEntity.ok(moduleService.saveModule(module));
    }

    /**
     * Update a term's content that was generated
     */
    @PutMapping("/{id}/terms/{termIndex}/content")
    public ResponseEntity<Map<String, Object>> updateTermContent(
            @PathVariable Long id,
            @PathVariable Integer termIndex,
            @RequestBody TermContentUpdateDto request) {

        Module module = moduleService.getModuleById(id);

        // Verify the term index is valid
        if (module.getKeyTerms() == null || termIndex >= module.getKeyTerms().size()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Invalid term index: " + termIndex
            ));
        }

        // Update content as needed (this would be implemented in ModuleService)
        // For now we just return success

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("moduleId", id);
        response.put("termIndex", termIndex);

        return ResponseEntity.ok(response);
    }
}