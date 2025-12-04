package com.secureauth.entities;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * Entité Role - Représente un rôle dans le système IAM
 * Exemples: USER, MANAGER, ADMIN, SECURITY
 */
@Entity
@Table(name = "roles")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String name;

    @Column(length = 255)
    private String description;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "role_permissions",
        joinColumns = @JoinColumn(name = "role_id"),
        inverseJoinColumns = @JoinColumn(name = "permission_id")
    )
    @Builder.Default
    private Set<Permission> permissions = new HashSet<>();

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Builder.Default
    @Column(nullable = false)
    private Boolean active = true;

    /**
     * Ajoute une permission au rôle
     */
    public void addPermission(Permission permission) {
        this.permissions.add(permission);
    }

    /**
     * Retire une permission du rôle
     */
    public void removePermission(Permission permission) {
        this.permissions.remove(permission);
    }
}
