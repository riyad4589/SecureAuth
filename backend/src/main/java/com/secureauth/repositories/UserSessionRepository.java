package com.secureauth.repositories;

import com.secureauth.entities.User;
import com.secureauth.entities.UserSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserSessionRepository extends JpaRepository<UserSession, Long> {
    
    List<UserSession> findByUserIdAndActiveTrue(Long userId);
    
    Optional<UserSession> findBySessionToken(String sessionToken);
    
    List<UserSession> findByExpiresAtBeforeAndActiveTrue(LocalDateTime dateTime);
    
    void deleteByUserId(Long userId);
    
    void deleteByUser(User user);
    
    long countByUserIdAndActiveTrue(Long userId);
}
