package com.secureauth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO pour la réponse d'authentification
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthenticationResponse {

    private String accessToken;
    private String refreshToken;
    private String tokenType;
    private Long expiresIn;
    private UserResponse user;
    private Boolean requires2FA;
    private String tempToken;
    private String sessionToken;

    @Builder.Default
    private String tokenTypeValue = "Bearer";
}
