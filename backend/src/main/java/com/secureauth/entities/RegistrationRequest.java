package com.secureauth.entities;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * Entité RegistrationRequest - Gère les demandes d'inscription utilisateur
 * Nécessite validation par un administrateur
 */
@Entity
@Table(name = "registration_requests")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegistrationRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false, length = 100)
    private String firstName;

    @Column(nullable = false, length = 100)
    private String lastName;

    @Column(length = 20)
    private String phoneNumber;

    @Column(nullable = false, length = 200)
    private String companyName;

    @Column(columnDefinition = "TEXT")
    private String requestReason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private RequestStatus status = RequestStatus.PENDING;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime requestedAt;

    private LocalDateTime processedAt;

    @Column(length = 50)
    private String processedBy;

    @Column(columnDefinition = "TEXT")
    private String adminComment;

    /**
     * Statuts possibles d'une demande d'inscription
     */
    public enum RequestStatus {
        PENDING,    // En attente de traitement
        APPROVED,   // Approuvée
        REJECTED    // Rejetée
    }
}
