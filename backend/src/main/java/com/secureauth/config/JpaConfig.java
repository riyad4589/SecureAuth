package com.secureauth.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

/**
 * Configuration JPA pour l'auditing automatique des entités
 */
@Configuration
@EnableJpaAuditing(auditorAwareRef = "auditorProvider", modifyOnCreate = false)
public class JpaConfig {

    @Bean
    public AuditorAware<String> auditorProvider() {
        return () -> {
            try {
                Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
                if (authentication == null || !authentication.isAuthenticated() 
                        || "anonymousUser".equals(authentication.getPrincipal())) {
                    return Optional.of("system");
                }
                return Optional.of(authentication.getName());
            } catch (Exception e) {
                return Optional.of("system");
            }
        };
    }
}
