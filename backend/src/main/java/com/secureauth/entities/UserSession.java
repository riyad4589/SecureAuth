package com.secureauth.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_sessions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String sessionToken;

    @Column(length = 45)
    private String ipAddress;

    @Column(length = 500)
    private String userAgent;

    @Column(nullable = false)
    private LocalDateTime loginTime;

    @Column(nullable = false)
    private LocalDateTime lastActivity;

    @Column(nullable = false)
    private LocalDateTime expiresAt;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @PrePersist
    protected void onCreate() {
        if (loginTime == null) {
            loginTime = LocalDateTime.now();
        }
        if (lastActivity == null) {
            lastActivity = LocalDateTime.now();
        }
        if (expiresAt == null) {
            expiresAt = LocalDateTime.now().plusHours(24);
        }
    }

    public void updateActivity() {
        this.lastActivity = LocalDateTime.now();
    }

    public void invalidate() {
        this.active = false;
    }
}
