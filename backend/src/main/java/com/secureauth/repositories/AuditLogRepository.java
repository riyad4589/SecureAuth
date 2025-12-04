package com.secureauth.repositories;

import com.secureauth.entities.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository pour l'entité AuditLog
 */
@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    /**
     * Recherche les logs par username
     */
    Page<AuditLog> findByUsername(String username, Pageable pageable);

    /**
     * Recherche les logs par action
     */
    Page<AuditLog> findByAction(String action, Pageable pageable);

    /**
     * Recherche les logs par succès/échec
     */
    Page<AuditLog> findBySuccess(Boolean success, Pageable pageable);

    /**
     * Recherche les logs dans une période donnée
     */
    Page<AuditLog> findByTimestampBetween(
            LocalDateTime startDate, 
            LocalDateTime endDate, 
            Pageable pageable
    );

    /**
     * Recherche avancée avec filtres multiples
     */
    @Query("SELECT a FROM AuditLog a WHERE " +
           "(:username IS NULL OR a.username = :username) AND " +
           "(:action IS NULL OR a.action = :action) AND " +
           "(:success IS NULL OR a.success = :success) AND " +
           "(:startDate IS NULL OR a.timestamp >= :startDate) AND " +
           "(:endDate IS NULL OR a.timestamp <= :endDate)")
    Page<AuditLog> findByFilters(
            @Param("username") String username,
            @Param("action") String action,
            @Param("success") Boolean success,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable
    );

    /**
     * Récupère les derniers logs d'un utilisateur
     */
    List<AuditLog> findTop10ByUsernameOrderByTimestampDesc(String username);

    /**
     * Recherche par action et date
     */
    List<AuditLog> findByActionAndTimestampAfter(String action, LocalDateTime timestamp);

    /**
     * Recherche par IP et période
     */
    List<AuditLog> findByIpAddressAndTimestampBetween(String ipAddress, LocalDateTime start, LocalDateTime end);

    /**
     * Recherche par actions multiples et période
     */
    List<AuditLog> findByActionInAndTimestampBetween(List<String> actions, LocalDateTime start, LocalDateTime end);

    /**
     * Export: recherche par période sans pagination
     */
    List<AuditLog> findAllByTimestampBetween(LocalDateTime start, LocalDateTime end);
}
