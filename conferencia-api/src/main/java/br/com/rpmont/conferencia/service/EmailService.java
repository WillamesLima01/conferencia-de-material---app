package br.com.rpmont.conferencia.service;

public interface EmailService {

    void enviarCodigoRecuperacao(
            String destinatario,
            String codigo
    );
}