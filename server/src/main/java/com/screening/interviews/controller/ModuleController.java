package com.screening.interviews.controller;

import com.screening.interviews.dto.*;
import com.screening.interviews.model.Module;
import com.screening.interviews.service.ModuleContentService;
import com.screening.interviews.service.ModuleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    // Get all modules
    @GetMapping
    public ResponseEntity<List<Module>> getAllModules() {
        List<Module> modules = moduleService.getAllModules();
        return new ResponseEntity<>(modules, HttpStatus.OK);
    }

    // Get a module by ID
    @GetMapping("/{id}")
    public ResponseEntity<Module> getModuleById(@PathVariable Long id) {
        Module module = moduleService.getModuleById(id);
        return new ResponseEntity<>(module, HttpStatus.OK);
    }

    @PostMapping("/{id}/key-terms")
    public ResponseEntity<Module> updateModuleKeyTerms(
            @PathVariable Long id,
            @RequestBody KeyTermsUpdateDto keyTermsUpdateDto) {
        Module updatedModule = moduleService.updateModuleKeyTerms(
                id,
                keyTermsUpdateDto.getKeyTerms(),
                keyTermsUpdateDto.getDefinitions()
        );
        return new ResponseEntity<>(updatedModule, HttpStatus.OK);
    }

    @PostMapping("/keyterms/extract")
    public ResponseEntity<KeyTermResponseDto> extractKeyTerms(@RequestBody KeyTermRequestDto request) {
        KeyTermResponseDto response = moduleContentService.extractTheKeyTerms(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Generate educational content for a specific term
     * Creates a submodule, quiz, and finds relevant video content
     *
     * @param request The term content generation request
     * @return A response containing the generated content
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
     * Generate educational content for a specific term without saving to database
     * Creates a submodule, quiz, and finds relevant video content
     *
     * @param request The term content generation request
     * @return A response containing the generated content
     */
    @PostMapping("/term/preview")
    public ResponseEntity<TermContentResponseDto> previewTermContent(
            @RequestBody TermContentRequestDto request) {
        // Force saveContent to false for preview
        request.setSaveContent(false);

        TermContentResponseDto response = moduleContentService.generateTermContent(request);
        return ResponseEntity.ok(response);
    }
}