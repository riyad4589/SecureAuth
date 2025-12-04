package com.secureauth.exceptions;

/**
 * Exception levée lors d'une erreur d'authentification
 */
public class AuthenticationException extends RuntimeException {
    
    public AuthenticationException(String message) {
        super(message);
    }
}
