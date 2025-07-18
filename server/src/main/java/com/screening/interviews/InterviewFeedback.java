package com.screening.interviews;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.data.redis.RedisRepositoriesAutoConfiguration;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;

@SpringBootApplication(exclude = {RedisRepositoriesAutoConfiguration.class})
@EnableTransactionManagement
@EnableAsync
@EnableScheduling
public class InterviewFeedback {

    private final DataSource dataSource;

    public InterviewFeedback(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    public static void main(String[] args) {
        // Print environment info for debugging
        System.out.println("=== Starting InstructAI Application ===");
        System.out.println("Active Profile: " + System.getProperty("spring.profiles.active"));
        System.out.println("DATABASE_URL present: " + (System.getenv("DATABASE_URL") != null));
        System.out.println("PORT: " + System.getenv("PORT"));
        System.out.println("SPRING_PROFILES_ACTIVE: " + System.getenv("SPRING_PROFILES_ACTIVE"));
        
        // Set system properties for better startup
        System.setProperty("spring.jpa.open-in-view", "false");
        System.setProperty("spring.jpa.properties.hibernate.enable_lazy_load_no_trans", "true");
        
        SpringApplication application = new SpringApplication(InterviewFeedback.class);
        application.setAdditionalProfiles("prod");
        application.run(args);
    }

    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        try (Connection connection = dataSource.getConnection()) {
            System.out.println("✅ Database connection established successfully!");
            System.out.println("Database URL: " + connection.getMetaData().getURL());
            System.out.println("Database Product: " + connection.getMetaData().getDatabaseProductName());
            System.out.println("Database Version: " + connection.getMetaData().getDatabaseProductVersion());
        } catch (SQLException e) {
            System.err.println("❌ Database connection failed: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
