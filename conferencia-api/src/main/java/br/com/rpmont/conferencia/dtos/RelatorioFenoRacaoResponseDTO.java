package br.com.rpmont.conferencia.dtos;

import java.time.LocalDate;
import java.util.List;

public record RelatorioFenoRacaoResponseDTO(

        LocalDate dataInicial,

        LocalDate dataFinal,

        String unidade,

        Boolean relatorioGeral,

        ResumoRelatorioFenoRacaoDTO resumo,

        List<ResumoProdutoFenoRacaoDTO> resumoPorProduto,

        List<LoteFenoRacaoResponseDTO> estoqueAtual,

        List<EntradaFenoRacaoResponseDTO> entradas,

        List<MovimentacaoFenoRacaoResponseDTO> saidas,

        List<MovimentacaoFenoRacaoResponseDTO> extravios,

        List<TransferenciaFenoRacaoResponseDTO> transferencias,

        List<TransferenciaFenoRacaoResponseDTO> transferenciasRecebidas,

        List<TransferenciaFenoRacaoResponseDTO> transferenciasEnviadas

) {
}