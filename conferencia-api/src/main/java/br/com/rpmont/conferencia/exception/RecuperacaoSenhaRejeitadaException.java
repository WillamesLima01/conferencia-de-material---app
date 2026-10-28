package br.com.rpmont.conferencia.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/** Rejeição esperada que permite persistir tentativas e invalidações da recuperação. */
public final class RecuperacaoSenhaRejeitadaException extends ResponseStatusException {

    public RecuperacaoSenhaRejeitadaException(HttpStatus status, String motivo) {
        super(status, motivo);
    }
}
