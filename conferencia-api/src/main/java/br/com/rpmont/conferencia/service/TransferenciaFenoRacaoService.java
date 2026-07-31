package br.com.rpmont.conferencia.service;

import br.com.rpmont.conferencia.dtos.TransferenciaFenoRacaoResponseDTO;
import br.com.rpmont.conferencia.enums.SituacaoTransferenciaFenoRacao;

import java.time.LocalDate;
import java.util.List;

public interface TransferenciaFenoRacaoService {

    List<TransferenciaFenoRacaoResponseDTO> listarEnviadas(
            Integer produtoId,
            LocalDate dataInicial,
            LocalDate dataFinal,
            SituacaoTransferenciaFenoRacao situacao,
            String matriculaUsuario
    );

    List<TransferenciaFenoRacaoResponseDTO> listarRecebidas(
            Integer produtoId,
            LocalDate dataInicial,
            LocalDate dataFinal,
            SituacaoTransferenciaFenoRacao situacao,
            String matriculaUsuario
    );

    List<TransferenciaFenoRacaoResponseDTO> listarTodas(
            Integer produtoId,
            LocalDate dataInicial,
            LocalDate dataFinal,
            SituacaoTransferenciaFenoRacao situacao,
            String matriculaUsuario
    );

    TransferenciaFenoRacaoResponseDTO buscarPorId(
            Long transferenciaId,
            String matriculaUsuario
    );
}