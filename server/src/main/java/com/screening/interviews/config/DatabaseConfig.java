package com.screening.interviews.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.boot.jdbc.DataSourceBuilder;
import com.zaxxer.hikari.HikariDataSource;

import javax.sql.DataSource;
import java.net.URI;
import java.net.URISyntaxException;

@Configuration
@Profile("prod")
public class DatabaseConfig {

    @Value("${DATABASE_URL:}")
    private String databaseUrl;

    @Bean
    public DataSource dataSource() throws URISyntaxException {
        if (databaseUrl == null || databaseUrl.isEmpty()) {
            throw new IllegalStateException("DATABASE_URL environment variable is not set");
        }

        System.out.println("Original DATABASE_URL: " + databaseUrl);

        // Handle both postgres:// and postgresql:// URLs
        String normalizedUrl = databaseUrl;
        if (databaseUrl.startsWith("postgres://")) {
            normalizedUrl = databaseUrl.replace("postgres://", "postgresql://");
        }

        // Parse the DATABASE_URL
        URI dbUri = new URI(normalizedUrl);
        
        String username = dbUri.getUserInfo().split(":")[0];
        String password = dbUri.getUserInfo().split(":")[1];
        String host = dbUri.getHost();
        int port = dbUri.getPort();
        String database = dbUri.getPath().substring(1); // Remove leading '/'
        
        String jdbcUrl = String.format("jdbc:postgresql://%s:%d/%s?sslmode=require", host, port, database);
        
        System.out.println("Database Configuration:");
        System.out.println("JDBC URL: " + jdbcUrl);
        System.out.println("Username: " + username);
        System.out.println("Host: " + host);
        System.out.println("Port: " + port);
        System.out.println("Database: " + database);

        HikariDataSource dataSource = new HikariDataSource();
        dataSource.setJdbcUrl(jdbcUrl);
        dataSource.setUsername(username);
        dataSource.setPassword(password);
        dataSource.setDriverClassName("org.postgresql.Driver");
        dataSource.setMaximumPoolSize(5);
        dataSource.setMinimumIdle(2);
        dataSource.setConnectionTimeout(20000);
        dataSource.setIdleTimeout(300000);
        dataSource.setLeakDetectionThreshold(60000);
        dataSource.setValidationTimeout(5000);
        
        return dataSource;
    }
}