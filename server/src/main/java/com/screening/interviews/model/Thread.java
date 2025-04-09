package com.screening.interviews.model;

import com.fasterxml.jackson.annotation.JsonIdentityInfo;
import com.fasterxml.jackson.annotation.JsonIdentityReference;
import com.fasterxml.jackson.annotation.ObjectIdGenerators;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Data
@Table(name = "threads")
@JsonIdentityInfo(generator = ObjectIdGenerators.PropertyGenerator.class, property = "id")
public class Thread {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(length = 1000)
    private String description;

    @ManyToOne
    @JoinColumn(name = "parent_thread_id")
    @JsonIdentityReference(alwaysAsId = true)
    private Thread parentThread;

    @OneToMany(mappedBy = "parentThread", cascade = CascadeType.ALL)
    @OrderBy("name ASC")
    @JsonIdentityReference(alwaysAsId = true)
    private List<Thread> subThreads = new ArrayList<>();

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(nullable = false)
    private boolean active = true;

    @ManyToMany
    @JoinTable(
            name = "thread_course_mapping",
            joinColumns = @JoinColumn(name = "thread_id"),
            inverseJoinColumns = @JoinColumn(name = "course_id")
    )
    @OrderBy("title ASC")
    private List<Course> relatedCourses = new ArrayList<>();

    @ManyToMany
    @JoinTable(
            name = "thread_members",
            joinColumns = @JoinColumn(name = "thread_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    @OrderBy("username ASC")
    private List<User> members = new ArrayList<>();

    // Utility methods
    public void addSubThread(Thread thread) {
        if (!subThreads.contains(thread)) {
            subThreads.add(thread);
            thread.setParentThread(this);
        }
    }

    public void removeSubThread(Thread thread) {
        if (subThreads.contains(thread)) {
            subThreads.remove(thread);
            thread.setParentThread(null);
        }
    }

    public void addRelatedCourse(Course course) {
        if (!relatedCourses.contains(course)) {
            relatedCourses.add(course);
            if (!course.getRelatedThreads().contains(this)) {
                course.getRelatedThreads().add(this);
            }
        }
    }

    public void removeRelatedCourse(Course course) {
        if (relatedCourses.contains(course)) {
            relatedCourses.remove(course);
            course.getRelatedThreads().remove(this);
        }
    }

    public void addMember(User user) {
        if (!members.contains(user)) {
            members.add(user);
            if (!user.getThreads().contains(this)) {
                user.getThreads().add(this);
            }
        }
    }

    public void removeMember(User user) {
        if (members.contains(user)) {
            members.remove(user);
            user.getThreads().remove(this);
        }
    }
}
