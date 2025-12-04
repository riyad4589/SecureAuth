package com.secureauth.repositories;

import com.secureauth.entities.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository pour l'entité Role
 */
@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {

    /**
     * Recherche un rôle par son nom
     */
    Optional<Role> findByName(String name);

    /**
     * Vérifie si un rôle existe par son nom
     */
    boolean existsByName(String name);
}
