package br.com.rpmont.conferencia.dtos;

import br.com.rpmont.conferencia.enums.SituacaoTransferenciaFenoRacao;
import br.com.rpmont.conferencia.enums.TipoProdutoFenoRacao;
import br.com.rpmont.conferencia.enums.UnidadeControleFenoRacao;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record TransferenciaFenoRacaoResponseDTO(

        Long id,

        Long solicitacaoId,

        Integer produtoId,

        TipoProdutoFenoRacao tipoProduto,

        String nomeProduto,

        UnidadeControleFenoRacao unidadeControle,

        Integer loteOrigemId,

        String codigoLoteOrigem,

        Integer loteDestinoId,

        String codigoLoteDestino,

        String unidadeOrigem,

        String unidadeDestino,

        Integer quantidadeTransferida,

        BigDecimal pesoUnidadeKg,

        BigDecimal pesoTotalKg,

        Integer saldoAnteriorOrigem,

        Integer saldoPosteriorOrigem,

        Long aprovadoPorId,

        String aprovadoPorNome,

        LocalDateTime dataTransferencia,

        String observacao,

        SituacaoTransferenciaFenoRacao situacao

) {
}