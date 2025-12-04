package com.secureauth.entities;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * Entité AuditLog - Journalise toutes les actions critiques du système
 * Permet la traçabilité complète des opérations IAM
 */
@Entity
@Table(name = "audit_logs")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String username;

    @Column(nullable = false, length = 100)
    private String action;

    @Column(columnDefinition = "TEXT")
    private String details;

    @Column(length = 50)
    private String ipAddress;

    @Column(length = 255)
    private String userAgent;

    @Builder.Default
    @Column(nullable = false)
    private Boolean success = true;

    @Column(columnDefinition = "TEXT")
    private String errorMessage;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime timestamp;

    /**
     * Types d'actions auditées
     */
    public static class Action {
        public static final String LOGIN_SUCCESS = "LOGIN_SUCCESS";
        public static final String LOGIN_FAILED = "LOGIN_FAILED";
        public static final String LOGOUT = "LOGOUT";
        public static final String PASSWORD_CHANGED = "PASSWORD_CHANGED";
        public static final String PASSWORD_RESET = "PASSWORD_RESET";
        public static final String USER_CREATED = "USER_CREATED";
        public static final String USER_UPDATED = "USER_UPDATED";
        public static final String USER_DELETED = "USER_DELETED";
        public static final String USER_ENABLED = "USER_ENABLED";
        public static final String USER_DISABLED = "USER_DISABLED";
        public static final String USER_LOCKED = "USER_LOCKED";
        public static final String USER_UNLOCKED = "USER_UNLOCKED";
        public static final String ROLE_ASSIGNED = "ROLE_ASSIGNED";
        public static final String ROLE_REMOVED = "ROLE_REMOVED";
        public static final String ROLE_CREATED = "ROLE_CREATED";
        public static final String ROLE_UPDATED = "ROLE_UPDATED";
        public static final String ROLE_DELETED = "ROLE_DELETED";
        public static final String PERMISSION_ASSIGNED = "PERMISSION_ASSIGNED";
        public static final String PERMISSION_REMOVED = "PERMISSION_REMOVED";
        public static final String REGISTRATION_APPROVED = "REGISTRATION_APPROVED";
        public static final String REGISTRATION_REJECTED = "REGISTRATION_REJECTED";
    }
}
