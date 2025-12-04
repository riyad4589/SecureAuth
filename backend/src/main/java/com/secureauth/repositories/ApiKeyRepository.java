package com.secureauth.repositories;

import com.secureauth.entities.ApiKey;
import com.secureauth.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ApiKeyRepository extends JpaRepository<ApiKey, Long> {
    
    Optional<ApiKey> findByKeyHash(String keyHash);
    
    @Query("SELECT ak FROM ApiKey ak JOIN FETCH ak.user WHERE ak.keyHash = :keyHash")
    Optional<ApiKey> findByKeyHashWithUser(@Param("keyHash") String keyHash);
    
    List<ApiKey> findByUserIdAndActiveTrue(Long userId);
    
    List<ApiKey> findByUserId(Long userId);
    
    List<ApiKey> findByExpiresAtBeforeAndActiveTrue(LocalDateTime dateTime);
    
    boolean existsByKeyHash(String keyHash);

    void deleteByUser_Id(Long userId);
    
    void deleteByUser(User user);

}
