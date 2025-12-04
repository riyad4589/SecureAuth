package com.secureauth.entities;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Entité User - Représente un utilisateur du système IAM
 * Implémente UserDetails pour l'intégration Spring Security
 */
@Entity
@Table(name = "users")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(length = 100)
    private String firstName;

    @Column(length = 100)
    private String lastName;

    @Column(length = 20)
    private String phoneNumber;

    @Column(length = 100)
    private String department;

    @Builder.Default
    @Column(nullable = false)
    private Boolean enabled = true;

    @Builder.Default
    @Column(nullable = false)
    private Boolean accountNonLocked = true;

    @Builder.Default
    @Column(nullable = false)
    private Boolean accountNonExpired = true;

    @Builder.Default
    @Column(nullable = false)
    private Boolean credentialsNonExpired = true;

    @Builder.Default
    @Column(nullable = false)
    private Integer failedLoginAttempts = 0;

    private LocalDateTime lockTime;

    @Builder.Default
    @Column(nullable = false)
    private Boolean mustChangePassword = false;

    @Builder.Default
    @Column(nullable = false)
    private Boolean twoFactorEnabled = false;

    @Column(length = 32)
    private String twoFactorSecret;

    private LocalDateTime passwordChangedAt;

    @Column(length = 500)
    private String passwordHistory;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "user_roles",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    @Builder.Default
    private Set<Role> roles = new HashSet<>();

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    private LocalDateTime lastLoginAt;

    // UserDetails implementation
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return roles.stream()
            .flatMap(role -> {
                Set<GrantedAuthority> authorities = new HashSet<>();
                authorities.add(new SimpleGrantedAuthority("ROLE_" + role.getName()));
                authorities.addAll(role.getPermissions().stream()
                    .map(permission -> new SimpleGrantedAuthority(permission.getName()))
                    .collect(Collectors.toSet()));
                return authorities.stream();
            })
            .collect(Collectors.toSet());
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return accountNonExpired;
    }

    @Override
    public boolean isAccountNonLocked() {
        return accountNonLocked;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return credentialsNonExpired;
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }

    /**
     * Vérifie si le compte est verrouillé et si la durée de verrouillage est expirée
     */
    public boolean isLockExpired(long lockDurationMs) {
        if (lockTime == null) {
            return false;
        }
        return LocalDateTime.now().isAfter(lockTime.plusNanos(lockDurationMs * 1_000_000));
    }

    /**
     * Incrémente le compteur de tentatives échouées
     */
    public void incrementFailedAttempts() {
        this.failedLoginAttempts++;
    }

    /**
     * Réinitialise le compteur de tentatives échouées
     */
    public void resetFailedAttempts() {
        this.failedLoginAttempts = 0;
    }

    /**
     * Verrouille le compte
     */
    public void lock() {
        this.accountNonLocked = false;
        this.lockTime = LocalDateTime.now();
    }

    /**
     * Déverrouille le compte
     */
    public void unlock() {
        this.accountNonLocked = true;
        this.lockTime = null;
        this.failedLoginAttempts = 0;
    }
}
