package br.com.rpmont.conferencia.service;

import br.com.rpmont.conferencia.dtos.CadastrarEntradaFenoRacaoRequestDTO;
import br.com.rpmont.conferencia.dtos.EntradaFenoRacaoResponseDTO;
import br.com.rpmont.conferencia.dtos.LoteFenoRacaoResponseDTO;
import br.com.rpmont.conferencia.enums.SituacaoLoteFenoRacao;
import br.com.rpmont.conferencia.enums.TipoProdutoFenoRacao;

import java.math.BigDecimal;
import java.util.List;

public interface EstoqueFenoRacaoService {

    EntradaFenoRacaoResponseDTO cadastrarEntrada(
            CadastrarEntradaFenoRacaoRequestDTO request,
            String matriculaUsuario
    );

    List<LoteFenoRacaoResponseDTO> listarEstoque(
            TipoProdutoFenoRacao tipoProduto,
            BigDecimal pesoUnidadeKg,
            SituacaoLoteFenoRacao situacao,
            String unidade,
            String matriculaUsuario
    );

    LoteFenoRacaoResponseDTO buscarLotePorId(
            Integer loteId,
            String matriculaUsuario
    );

    List<LoteFenoRacaoResponseDTO> listarLotesDisponiveis(
            TipoProdutoFenoRacao tipoProduto,
            BigDecimal pesoUnidadeKg,
            String unidade,
            String matriculaUsuario
    );

    EntradaFenoRacaoResponseDTO atualizarEntrada(
            Integer loteId,
            CadastrarEntradaFenoRacaoRequestDTO request,
            String matriculaUsuario
    );

    EntradaFenoRacaoResponseDTO cancelarEntrada(
            Integer loteId,
            String motivo,
            String matriculaUsuario
    );
}