package com.screening.interviews.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "courses")
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    // This is a unique business key (distinct from the primary key 'id'),
    // to represent a course's unique identifier if needed:
    @Column(name = "course_uuid", nullable = false, updatable = false, unique = true)
    private String courseUuid;

    private String title;
    @Column(name = "description", columnDefinition = "text")
    private String description;
    private String difficultyLevel;

    /**
     * By default, @ElementCollection creates a separate table
     * to store the list of prerequisites as strings.
     * Alternatively, you could create a separate entity if you need more detail.
     */
    @ElementCollection
    @CollectionTable(name = "course_prerequisites", joinColumns = @JoinColumn(name = "course_id"))
    @Column(name = "prerequisite")
    private List<String> prerequisites;

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<Module> modules;

    @ManyToMany(mappedBy = "relatedCourses")
    @OrderBy("name ASC")
    private List<Thread> relatedThreads = new ArrayList<>();

    /**
     * Before inserting, generate a random UUID for the business key:
     */
    @PrePersist
    public void prePersist() {
        if (courseUuid == null) {
            this.courseUuid = UUID.randomUUID().toString();
        }
    }
}
