package com.secureauth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO pour la réponse de réinitialisation de mot de passe
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResetPasswordResponse {
    
    private Long userId;
    private String username;
    private String temporaryPassword;
    private String message;
}
