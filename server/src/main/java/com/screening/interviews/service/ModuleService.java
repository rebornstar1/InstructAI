package com.screening.interviews.service;

import com.screening.interviews.exception.ResourceNotFoundException;
import com.screening.interviews.model.Module;
import com.screening.interviews.repo.ModuleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ModuleService {

    private final ModuleRepository moduleRepository;

    @Autowired
    public ModuleService(ModuleRepository moduleRepository) {
        this.moduleRepository = moduleRepository;
    }

    // Get all modules
    public List<Module> getAllModules() {
        return moduleRepository.findAll();
    }

    // Get module by ID
    public Module getModuleById(Long id) {
        return moduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Module not found with id: " + id));
    }

    public Module updateModuleKeyTerms(Long id, List<String> keyTerms, List<String> definitions) {
        Module module = getModuleById(id);

        // Update the key terms and definitions
        module.setKeyTerms(keyTerms);
        module.setDefinitions(definitions);

        // Save and return the updated module
        return moduleRepository.save(module);
    }

    public Module saveModule(Module module) {
        return moduleRepository.save(module);
    }
}