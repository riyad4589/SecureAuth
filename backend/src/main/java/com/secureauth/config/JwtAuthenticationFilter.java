package com.secureauth.config;

import com.secureauth.entities.User;
import com.secureauth.services.ApiKeyService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filtre JWT et API Key - Intercepte les requêtes et valide le token JWT ou la clé API
 * S'exécute une fois par requête
 */
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;
    private final ApiKeyService apiKeyService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        
        final String authHeader = request.getHeader("Authorization");

        // Vérifie la présence du header Authorization
        if (authHeader == null) {
            filterChain.doFilter(request, response);
            return;
        }

        // Gestion des clés API (ApiKey sk_xxx...)
        if (authHeader.startsWith("ApiKey ")) {
            handleApiKeyAuthentication(authHeader.substring(7), request);
            filterChain.doFilter(request, response);
            return;
        }

        // Gestion des tokens JWT (Bearer xxx...)
        if (authHeader.startsWith("Bearer ")) {
            handleJwtAuthentication(authHeader.substring(7), request);
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Authentification par clé API
     */
    private void handleApiKeyAuthentication(String apiKey, HttpServletRequest request) {
        try {
            if (apiKeyService.validateApiKey(apiKey)) {
                User user = apiKeyService.getUserByApiKey(apiKey);
                if (user != null) {
                    UserDetails userDetails = userDetailsService.loadUserByUsername(user.getUsername());
                    
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities()
                    );
                    authToken.setDetails(
                            new WebAuthenticationDetailsSource().buildDetails(request)
                    );
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    
                    logger.debug("API Key authentication successful for user: " + user.getUsername());
                }
            } else {
                logger.warn("Invalid or expired API key");
            }
        } catch (Exception e) {
            logger.error("API Key validation error: " + e.getMessage());
        }
    }

    /**
     * Authentification par token JWT
     */
    private void handleJwtAuthentication(String jwt, HttpServletRequest request) {
        try {
            String username = jwtService.extractUsername(jwt);

            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);

                if (jwtService.isTokenValid(jwt, userDetails)) {
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities()
                    );
                    authToken.setDetails(
                            new WebAuthenticationDetailsSource().buildDetails(request)
                    );
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        } catch (Exception e) {
            logger.error("JWT validation error: " + e.getMessage());
        }
    }
}
