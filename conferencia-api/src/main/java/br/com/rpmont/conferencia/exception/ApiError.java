package br.com.rpmont.conferencia.exception;

import java.time.LocalDateTime;
import java.util.Map;

public record ApiError(
        LocalDateTime timestamp,
        int status,
        String error,
        String message,
        String path,
        Map<String, String> fields
) {

    public ApiError(
            LocalDateTime timestamp,
            int status,
            String error,
            String message,
            String path
    ) {
        this(
                timestamp,
                status,
                error,
                message,
                path,
                null
        );
    }
}