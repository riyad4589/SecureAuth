package com.secureauth.repositories;

import com.secureauth.entities.Permission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.Set;

/**
 * Repository pour l'entité Permission
 */
@Repository
public interface PermissionRepository extends JpaRepository<Permission, Long> {

    /**
     * Recherche une permission par son nom
     */
    Optional<Permission> findByName(String name);

    /**
     * Recherche des permissions par leurs noms
     */
    Set<Permission> findByNameIn(Set<String> names);

    /**
     * Vérifie si une permission existe par son nom
     */
    boolean existsByName(String name);
}
