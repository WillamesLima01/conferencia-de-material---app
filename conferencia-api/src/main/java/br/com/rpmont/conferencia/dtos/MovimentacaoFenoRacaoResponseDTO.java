package br.com.rpmont.conferencia.dtos;

import br.com.rpmont.conferencia.enums.SituacaoAnaliseExtravioFenoRacao;
import br.com.rpmont.conferencia.enums.SituacaoMovimentacaoFenoRacao;
import br.com.rpmont.conferencia.enums.TipoMovimentacaoFenoRacao;
import br.com.rpmont.conferencia.enums.TipoProdutoFenoRacao;
import br.com.rpmont.conferencia.enums.UnidadeControleFenoRacao;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record MovimentacaoFenoRacaoResponseDTO(

        Long id,

        Integer produtoId,

        TipoProdutoFenoRacao tipoProduto,

        String nomeProduto,

        UnidadeControleFenoRacao unidadeControle,

        Integer loteId,

        String codigoLote,

        TipoMovimentacaoFenoRacao tipoMovimentacao,

        Integer quantidadeUnidades,

        BigDecimal pesoUnidadeKg,

        BigDecimal quantidadeSolicitadaKg,

        BigDecimal pesoMovimentadoKg,

        BigDecimal sobraCalculadaKg,

        Integer saldoAnterior,

        Integer saldoPosterior,

        String unidadeOrigem,

        String unidadeDestino,

        LocalDate dataOperacao,

        String servico,

        String motivo,

        String observacao,

        String numeroDocumento,

        String responsavel,

        Long usuarioId,

        String usuarioSetor,

        SituacaoMovimentacaoFenoRacao situacao,

        SituacaoAnaliseExtravioFenoRacao situacaoAnaliseExtravio,

        Integer quantidadeConfirmada,

        Integer quantidadeDevolvida,

        Long usuarioAnaliseId,

        LocalDateTime dataAnalise,

        String motivoAnalise,

        Long movimentacaoOrigemId,

        Long transferenciaId,

        LocalDateTime dataCadastro,

        Long usuarioModificadorId,

        LocalDateTime dataModificacao

) {
}