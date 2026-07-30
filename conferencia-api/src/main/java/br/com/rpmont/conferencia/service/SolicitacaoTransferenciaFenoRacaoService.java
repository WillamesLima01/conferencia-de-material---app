package br.com.rpmont.conferencia.service;

import br.com.rpmont.conferencia.dtos.AprovarSolicitacaoTransferenciaFenoRacaoRequestDTO;
import br.com.rpmont.conferencia.dtos.SolicitacaoTransferenciaFenoRacaoRequestDTO;
import br.com.rpmont.conferencia.dtos.SolicitacaoTransferenciaFenoRacaoResponseDTO;
import br.com.rpmont.conferencia.enums.StatusSolicitacaoTransferenciaFenoRacao;

import java.util.List;

public interface SolicitacaoTransferenciaFenoRacaoService {

    SolicitacaoTransferenciaFenoRacaoResponseDTO solicitar(
            SolicitacaoTransferenciaFenoRacaoRequestDTO request,
            String matriculaUsuario
    );

    SolicitacaoTransferenciaFenoRacaoResponseDTO buscarPorId(
            Long solicitacaoId,
            String matriculaUsuario
    );

    List<SolicitacaoTransferenciaFenoRacaoResponseDTO>
    listarRecebidas(
            StatusSolicitacaoTransferenciaFenoRacao status,
            String matriculaUsuario
    );

    List<SolicitacaoTransferenciaFenoRacaoResponseDTO>
    listarEnviadas(
            String matriculaUsuario
    );

    SolicitacaoTransferenciaFenoRacaoResponseDTO negar(
            Long solicitacaoId,
            String observacaoResposta,
            String matriculaUsuario
    );

    SolicitacaoTransferenciaFenoRacaoResponseDTO aprovar(
            Long solicitacaoId,
            AprovarSolicitacaoTransferenciaFenoRacaoRequestDTO request,
            String matriculaUsuario
    );
}