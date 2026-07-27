package br.com.rpmont.conferencia.service;

import br.com.rpmont.conferencia.dtos.*;
import br.com.rpmont.conferencia.enums.StatusSolicitacaoTransferenciaFenoRacao;

import java.util.List;

public interface TransferenciaFenoRacaoService {

    SolicitacaoTransferenciaFenoRacaoResponseDTO solicitar(
            CriarSolicitacaoTransferenciaFenoRacaoRequestDTO request,
            String matriculaUsuario
    );

    SolicitacaoTransferenciaFenoRacaoResponseDTO buscarSolicitacaoPorId(
            Long solicitacaoId,
            String matriculaUsuario
    );

    List<SolicitacaoTransferenciaFenoRacaoResponseDTO> listarSolicitacoes(
            StatusSolicitacaoTransferenciaFenoRacao status,
            String matriculaUsuario
    );

    RespostaSolicitacaoTransferenciaFenoRacaoDTO responder(
            Long solicitacaoId,
            ResponderSolicitacaoTransferenciaFenoRacaoRequestDTO request,
            String matriculaUsuario
    );

    List<TransferenciaFenoRacaoResponseDTO> listarTransferencias(
            String unidade,
            String matriculaUsuario
    );

    TransferenciaFenoRacaoResponseDTO buscarTransferenciaPorId(
            Long transferenciaId,
            String matriculaUsuario
    );
}