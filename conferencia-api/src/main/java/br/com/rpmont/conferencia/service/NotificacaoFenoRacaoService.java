package br.com.rpmont.conferencia.service;

import br.com.rpmont.conferencia.dtos.MarcarNotificacaoLidaResponseDTO;
import br.com.rpmont.conferencia.dtos.NotificacaoFenoRacaoResponseDTO;

import java.util.List;

public interface NotificacaoFenoRacaoService {

    List<NotificacaoFenoRacaoResponseDTO> listar(
            String matriculaUsuario
    );

    List<NotificacaoFenoRacaoResponseDTO> listarNaoLidas(
            String matriculaUsuario
    );

    long contarNaoLidas(
            String matriculaUsuario
    );

    MarcarNotificacaoLidaResponseDTO marcarComoLida(
            Long notificacaoId,
            String matriculaUsuario
    );
}