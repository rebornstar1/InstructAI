package com.screening.interviews.controller;

import com.screening.interviews.service.ModuleContentService;
import com.screening.interviews.dto.KeyTermResponseDto;
import com.screening.interviews.dto.KeyTermRequestDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/keyterms")
public class KeyTermController {

    private final ModuleContentService keyTermService;

    @Autowired
    public KeyTermController(ModuleContentService keyTermService) {
        this.keyTermService = keyTermService;
    }

    @PostMapping("/extract")
    public ResponseEntity<KeyTermResponseDto> extractKeyTerms(
            @RequestBody KeyTermRequestDto requestDto) {

        KeyTermResponseDto responseDto = keyTermService.extractTheKeyTerms(requestDto);
        return ResponseEntity.ok(responseDto);
    }

    @GetMapping("/module/{moduleId}")
    public ResponseEntity<KeyTermResponseDto> getKeyTermsByModuleId(
            @PathVariable Long moduleId) {

        KeyTermRequestDto requestDto = new KeyTermRequestDto();
        requestDto.setModuleId(moduleId);

        KeyTermResponseDto responseDto = keyTermService.extractTheKeyTerms(requestDto);
        return ResponseEntity.ok(responseDto);
    }
}