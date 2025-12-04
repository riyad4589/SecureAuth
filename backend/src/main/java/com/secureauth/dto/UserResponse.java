package com.secureauth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;

/**
 * DTO pour la réponse utilisateur
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {

    private Long id;
    private String username;
    private String email;
    private String firstName;
    private String lastName;
    private String phoneNumber;
    private Boolean enabled;
    private Boolean accountNonLocked;
    private Boolean mustChangePassword;
    private Boolean twoFactorEnabled;
    private Set<String> roles;
    private LocalDateTime createdAt;
    private LocalDateTime lastLoginAt;
}
