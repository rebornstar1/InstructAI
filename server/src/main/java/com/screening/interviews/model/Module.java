package com.screening.interviews.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "modules")
public class Module {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    // Unique business key for the module.
    @Column(name = "module_uuid", nullable = false, updatable = false, unique = true)
    private String moduleUuid;

    // A plain string for moduleId (e.g. "M01").
    private String moduleId;

    private String title;

    @Column(name = "description", columnDefinition = "text")
    private String description;

    private String duration;

    @ElementCollection
    @CollectionTable(name = "module_learning_objectives", joinColumns = @JoinColumn(name = "module_id"))
    @Column(name = "objective")
    private List<String> learningObjectives;

    // Each Module belongs to one Course.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id")
    private Course course;

    // New fields for improved gradation and organization
    private String complexityLevel;  // Foundational, Basic, Intermediate, Advanced, Expert

    @ElementCollection
    private List<String> keyTerms;  // Important terms or concepts in this module

    @ElementCollection
    private List<String> prerequisiteModules;  // Modules that should be completed before this one

    // One Module can have many Submodules.
    @OneToMany(mappedBy = "module", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SubModule> subModules;

    @PrePersist
    public void prePersist() {
        if (moduleUuid == null) {
            this.moduleUuid = UUID.randomUUID().toString();
        }
    }
}
