package com.screening.interviews.repo;

import com.screening.interviews.model.SubModule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubModuleRepository extends JpaRepository<SubModule, Long> {
    List<SubModule> findByModule_Id(Long moduleId);
    int countByModuleId(Long moduleId);
}
