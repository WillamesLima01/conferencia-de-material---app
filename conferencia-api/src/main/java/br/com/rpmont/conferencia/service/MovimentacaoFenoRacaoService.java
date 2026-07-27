package br.com.rpmont.conferencia.service;

import br.com.rpmont.conferencia.dtos.CancelarMovimentacaoFenoRacaoRequestDTO;
import br.com.rpmont.conferencia.dtos.MovimentacaoFenoRacaoResponseDTO;
import br.com.rpmont.conferencia.dtos.RegistrarExtravioFenoRacaoRequestDTO;
import br.com.rpmont.conferencia.dtos.RegistrarSaidaFenoRacaoRequestDTO;
import br.com.rpmont.conferencia.enums.TipoMovimentacaoFenoRacao;
import br.com.rpmont.conferencia.enums.TipoProdutoFenoRacao;

import java.time.LocalDate;
import java.util.List;

public interface MovimentacaoFenoRacaoService {

    MovimentacaoFenoRacaoResponseDTO registrarSaida(
            RegistrarSaidaFenoRacaoRequestDTO request,
            String matriculaUsuario
    );

    MovimentacaoFenoRacaoResponseDTO registrarExtravio(
            RegistrarExtravioFenoRacaoRequestDTO request,
            String matriculaUsuario
    );

    MovimentacaoFenoRacaoResponseDTO buscarPorId(
            Long movimentacaoId,
            String matriculaUsuario
    );

    List<MovimentacaoFenoRacaoResponseDTO> listarPorLote(
            Integer loteId,
            String matriculaUsuario
    );

    List<MovimentacaoFenoRacaoResponseDTO> consultar(
            LocalDate dataInicial,
            LocalDate dataFinal,
            TipoProdutoFenoRacao tipoProduto,
            TipoMovimentacaoFenoRacao tipoMovimentacao,
            String unidade,
            String matriculaUsuario
    );

    MovimentacaoFenoRacaoResponseDTO cancelar(
            Long movimentacaoId,
            CancelarMovimentacaoFenoRacaoRequestDTO request,
            String matriculaUsuario
    );
}