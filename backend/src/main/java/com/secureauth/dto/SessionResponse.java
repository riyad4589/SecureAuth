package com.secureauth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionResponse {
    private Long id;
    private String username;
    private String ipAddress;
    private String userAgent;
    private LocalDateTime loginTime;
    private LocalDateTime lastActivity;
    private Boolean active;
    private Boolean currentSession;
}
