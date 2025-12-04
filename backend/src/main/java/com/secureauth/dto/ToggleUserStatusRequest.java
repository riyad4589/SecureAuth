package com.secureauth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO pour activer/désactiver un utilisateur
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ToggleUserStatusRequest {
    
    private Boolean active;
    private String reason;
}
