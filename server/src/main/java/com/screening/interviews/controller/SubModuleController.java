package com.screening.interviews.controller;

import com.screening.interviews.dto.SubModuleDto;
import com.screening.interviews.model.SubModule;
import com.screening.interviews.repo.SubModuleRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/submodules")
@CrossOrigin(origins = "*")
public class SubModuleController {

    private final SubModuleRepository subModuleRepository;

    public SubModuleController(SubModuleRepository subModuleRepository) {
        this.subModuleRepository = subModuleRepository;
    }

    @GetMapping("/byModule/{moduleId}")
    public ResponseEntity<List<SubModuleDto>> getSubModulesByModuleId(@PathVariable Long moduleId) {
        // Fetch submodules by module id using the repository method
        List<SubModule> subModules = subModuleRepository.findByModule_Id(moduleId);

        // Convert entity list to DTO list
        List<SubModuleDto> subModuleDtos = subModules.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());

        return ResponseEntity.ok(subModuleDtos);
    }

    private SubModuleDto convertToDto(SubModule subModule) {
        return SubModuleDto.builder()
                .moduleId(subModule.getModule() != null ? subModule.getModule().getId() : null)
                .subModuleTitle(subModule.getSubModuleTitle())
                .article(subModule.getArticle())
                .tags(subModule.getTags())
                .keywords(subModule.getKeywords())
                .readingTime(subModule.getReadingTime())
                .build();
    }
}
