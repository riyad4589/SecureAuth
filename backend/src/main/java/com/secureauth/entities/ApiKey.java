package com.secureauth.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "api_keys")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiKey {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 500)
    private String description;

    @Column(nullable = false, unique = true, length = 64)
    private String keyHash; // SHA-256 hash of the API key

    @Column(nullable = false, length = 10)
    private String keyPrefix; // First 8 chars for display (e.g., "sk_live_...")

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime expiresAt;

    private LocalDateTime lastUsedAt;

    @Builder.Default
    @Column(nullable = false)
    private Boolean active = true;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public boolean isExpired() {
        if (expiresAt == null) {
            return false;
        }
        return LocalDateTime.now().isAfter(expiresAt);
    }

    public void updateLastUsed() {
        this.lastUsedAt = LocalDateTime.now();
    }

    public void revoke() {
        this.active = false;
    }
}
