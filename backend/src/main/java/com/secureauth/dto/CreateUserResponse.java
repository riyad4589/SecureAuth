package com.secureauth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO pour la réponse de création d'utilisateur
 * Inclut le mot de passe temporaire généré
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateUserResponse {

    private UserResponse user;
    private String temporaryPassword;
    private String message;
}
