package com.secureauth.repositories;

import com.secureauth.entities.RegistrationRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository pour l'entité RegistrationRequest
 */
@Repository
public interface RegistrationRequestRepository extends JpaRepository<RegistrationRequest, Long> {

    /**
     * Recherche une demande par email
     */
    Optional<RegistrationRequest> findByEmail(String email);

    /**
     * Vérifie si une demande existe pour cet email
     */
    boolean existsByEmail(String email);

    /**
     * Recherche les demandes par statut
     */
    List<RegistrationRequest> findByStatus(RegistrationRequest.RequestStatus status);

    /**
     * Recherche les demandes en attente triées par date
     */
    List<RegistrationRequest> findByStatusOrderByRequestedAtAsc(RegistrationRequest.RequestStatus status);
}
