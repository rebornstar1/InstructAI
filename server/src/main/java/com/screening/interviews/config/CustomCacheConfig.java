package com.screening.interviews.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.interceptor.KeyGenerator;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.lang.reflect.Method;
import java.util.Arrays;

@Configuration
@RequiredArgsConstructor
public class CustomCacheConfig {

    private final ObjectMapper objectMapper;

    @Bean("customKeyGenerator")
    public KeyGenerator keyGenerator() {
        return new KeyGenerator() {
            @Override
            public Object generate(Object target, Method method, Object... params) {
                StringBuilder key = new StringBuilder();
                key.append(target.getClass().getSimpleName()).append(":");
                key.append(method.getName()).append(":");

                for (Object param : params) {
                    if (param != null) {
                        key.append(param.toString()).append(":");
                    }
                }

                return key.toString();
            }
        };
    }
}