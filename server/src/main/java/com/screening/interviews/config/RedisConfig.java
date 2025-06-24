package com.screening.interviews.config;

import com.fasterxml.jackson.annotation.JsonAutoDetect;
import com.fasterxml.jackson.annotation.PropertyAccessor;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.connection.lettuce.LettucePoolingClientConfiguration;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import org.apache.commons.pool2.impl.GenericObjectPoolConfig;

import java.time.Duration;

@Configuration
public class RedisConfig {

    @Value("${spring.data.redis.host:localhost}")
    private String redisHost;

    @Value("${spring.data.redis.port:6379}")
    private int redisPort;

    @Value("${spring.data.redis.password:}")
    private String redisPassword;

    @Value("${spring.data.redis.database:0}")
    private int database;

    @Bean
    @Primary
    public LettuceConnectionFactory redisConnectionFactory() {
        // Redis configuration
        RedisStandaloneConfiguration redisStandaloneConfiguration = new RedisStandaloneConfiguration();
        redisStandaloneConfiguration.setHostName(redisHost);
        redisStandaloneConfiguration.setPort(redisPort);
        redisStandaloneConfiguration.setDatabase(database);

        if (!redisPassword.isEmpty()) {
            redisStandaloneConfiguration.setPassword(redisPassword);
        }

        // Connection pool configuration
        GenericObjectPoolConfig<Object> poolConfig = new GenericObjectPoolConfig<>();
        poolConfig.setMaxTotal(20);
        poolConfig.setMaxIdle(10);
        poolConfig.setMinIdle(5);
        poolConfig.setTestOnBorrow(true);
        poolConfig.setTestOnReturn(true);
        poolConfig.setTestWhileIdle(true);

        LettucePoolingClientConfiguration clientConfiguration = LettucePoolingClientConfiguration.builder()
                .commandTimeout(Duration.ofSeconds(10))
                .poolConfig(poolConfig)
                .build();

        return new LettuceConnectionFactory(redisStandaloneConfiguration, clientConfiguration);
    }

    @Bean
    public ObjectMapper redisObjectMapper() {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.setVisibility(PropertyAccessor.ALL, JsonAutoDetect.Visibility.ANY);

        // Register JavaTimeModule for LocalDateTime support
        objectMapper.registerModule(new JavaTimeModule());

        // Configure for better JSON handling
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        objectMapper.disable(SerializationFeature.FAIL_ON_EMPTY_BEANS);
        objectMapper.enable(SerializationFeature.INDENT_OUTPUT); // Pretty print for debugging

        // Configure to handle missing properties gracefully
        objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        objectMapper.configure(DeserializationFeature.FAIL_ON_NULL_FOR_PRIMITIVES, false);
        objectMapper.configure(DeserializationFeature.ACCEPT_EMPTY_STRING_AS_NULL_OBJECT, true);
        objectMapper.configure(DeserializationFeature.ACCEPT_SINGLE_VALUE_AS_ARRAY, true);

        // Additional configuration for better deserialization
        objectMapper.configure(DeserializationFeature.USE_BIG_DECIMAL_FOR_FLOATS, true);
        objectMapper.configure(DeserializationFeature.USE_BIG_INTEGER_FOR_INTS, true);

        return objectMapper;
    }

    @Bean
    @Primary
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);

        // Use String serializer for keys
        StringRedisSerializer stringRedisSerializer = new StringRedisSerializer();
        template.setKeySerializer(stringRedisSerializer);
        template.setHashKeySerializer(stringRedisSerializer);

        // Use JSON serializer for values with custom ObjectMapper
        GenericJackson2JsonRedisSerializer jackson2JsonRedisSerializer =
                new GenericJackson2JsonRedisSerializer(redisObjectMapper());
        template.setValueSerializer(jackson2JsonRedisSerializer);
        template.setHashValueSerializer(jackson2JsonRedisSerializer);

        template.setDefaultSerializer(jackson2JsonRedisSerializer);
        template.afterPropertiesSet();
        return template;
    }
}