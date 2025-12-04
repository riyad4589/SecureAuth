package com.secureauth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateApiKeyRequest {
    
    @NotBlank(message = "API key name is required")
    private String name;
    
    private String description;
    
    private Integer expirationDays; // null = never expires
}
