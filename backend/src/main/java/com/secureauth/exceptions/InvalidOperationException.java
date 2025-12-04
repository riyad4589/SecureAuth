package com.secureauth.exceptions;

/**
 * Exception levée lors d'une opération invalide
 */
public class InvalidOperationException extends RuntimeException {
    
    public InvalidOperationException(String message) {
        super(message);
    }
}
