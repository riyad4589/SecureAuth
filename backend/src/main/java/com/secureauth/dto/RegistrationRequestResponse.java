package com.secureauth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO pour la réponse demande d'inscription
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegistrationRequestResponse {

    private Long id;
    private String email;
    private String firstName;
    private String lastName;
    private String phoneNumber;
    private String companyName;
    private String requestReason;
    private String status;
    private LocalDateTime requestedAt;
    private LocalDateTime processedAt;
    private String processedBy;
    private String adminComment;
}
