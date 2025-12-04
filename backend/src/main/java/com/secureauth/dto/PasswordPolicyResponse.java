package com.secureauth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PasswordPolicyResponse {
    private Integer minLength;
    private Integer maxLength;
    private Boolean requireUppercase;
    private Boolean requireLowercase;
    private Boolean requireNumbers;
    private Boolean requireSpecialChars;
    private Integer passwordExpirationDays;
    private Integer passwordHistoryCount;
    private Integer maxLoginAttempts;
    private Integer accountLockoutDurationMinutes;
}
