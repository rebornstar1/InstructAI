package com.screening.interviews.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "submodules")
public class SubModule {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    // A unique business key for the submodule.
    @Column(name = "submodule_uuid", nullable = false, updatable = false, unique = true)
    private String submoduleUuid;

    private String subModuleTitle;

    @Column(name = "article", columnDefinition = "text")
    private String article;

    // Optionally, store additional fields like reading time.
    private String readingTime;

    @ElementCollection
    @CollectionTable(name = "submodule_tags", joinColumns = @JoinColumn(name = "submodule_id"))
    @Column(name = "tag")
    private List<String> tags;

    @ElementCollection
    @CollectionTable(name = "submodule_keywords", joinColumns = @JoinColumn(name = "submodule_id"))
    @Column(name = "keyword")
    private List<String> keywords;

    // Many submodules belong to one module.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "module_id")
    @JsonBackReference
    private Module module;

    @PrePersist
    public void prePersist() {
        if (submoduleUuid == null) {
            this.submoduleUuid = UUID.randomUUID().toString();
        }
    }
}
