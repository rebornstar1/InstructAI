package com.screening.interviews.repo;

import com.screening.interviews.model.Module;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ModuleRepository extends JpaRepository<Module, Long> {
    List<Module> findByCourseId(Long courseId);

    Optional<Module> findByModuleId(String moduleId);
}
