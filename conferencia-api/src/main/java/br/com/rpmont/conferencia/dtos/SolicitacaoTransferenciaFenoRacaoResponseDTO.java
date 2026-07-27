package br.com.rpmont.conferencia.dtos;

import br.com.rpmont.conferencia.enums.StatusSolicitacaoTransferenciaFenoRacao;
import br.com.rpmont.conferencia.enums.TipoProdutoFenoRacao;
import br.com.rpmont.conferencia.enums.UnidadeControleFenoRacao;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record SolicitacaoTransferenciaFenoRacaoResponseDTO(

        Long id,

        Integer produtoId,

        TipoProdutoFenoRacao tipoProduto,

        String nomeProduto,

        UnidadeControleFenoRacao unidadeControle,

        Integer loteSolicitadoId,

        String codigoLote,

        String unidadeSolicitante,

        String unidadeOrigem,

        Integer quantidadeSolicitada,

        BigDecimal pesoUnidadeKg,

        BigDecimal pesoTotalSolicitadoKg,

        Integer quantidadeDisponivelNoPedido,

        Integer saldoPrevistoOrigem,

        String justificativa,

        StatusSolicitacaoTransferenciaFenoRacao status,

        Long solicitadoPorId,

        String solicitadoPorNome,

        LocalDateTime dataSolicitacao,

        Long respondidoPorId,

        String respondidoPorNome,

        LocalDateTime dataResposta,

        String observacaoResposta

) {
}