package com.secureauth.repositories;

import com.secureauth.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository pour l'entité User
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Recherche un utilisateur par son username
     */
    Optional<User> findByUsername(String username);

    /**
     * Recherche un utilisateur par son email
     */
    Optional<User> findByEmail(String email);

    /**
     * Vérifie si un username existe déjà
     */
    boolean existsByUsername(String username);

    /**
     * Vérifie si un email existe déjà
     */
    boolean existsByEmail(String email);

    /**
     * Recherche un utilisateur par username ou email
     */
    @Query("SELECT u FROM User u WHERE u.username = ?1 OR u.email = ?1")
    Optional<User> findByUsernameOrEmail(String usernameOrEmail);

    /**
     * Recherche les utilisateurs par statut actif et verrouillé
     */
    List<User> findByEnabledAndAccountNonLocked(Boolean enabled, Boolean accountNonLocked);

    /**
     * Recherche les utilisateurs par statut actif
     */
    List<User> findByEnabled(Boolean enabled);

    /**
     * Recherche les utilisateurs par statut verrouillé
     */
    List<User> findByAccountNonLocked(Boolean accountNonLocked);

    /**
     * Recherche les utilisateurs verrouillés
     */
    List<User> findByAccountNonLockedFalse();
}

