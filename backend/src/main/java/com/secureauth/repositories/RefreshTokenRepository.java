package com.secureauth.repositories;

import com.secureauth.entities.RefreshToken;
import com.secureauth.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository pour l'entité RefreshToken
 */
@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    /**
     * Recherche un refresh token par son token
     */
    Optional<RefreshToken> findByToken(String token);

    /**
     * Recherche tous les tokens d'un utilisateur
     */
    List<RefreshToken> findByUser(User user);

    /**
     * Supprime tous les tokens d'un utilisateur
     */
    void deleteByUser(User user);

    /**
     * Vérifie si un token existe
     */
    boolean existsByToken(String token);
}
