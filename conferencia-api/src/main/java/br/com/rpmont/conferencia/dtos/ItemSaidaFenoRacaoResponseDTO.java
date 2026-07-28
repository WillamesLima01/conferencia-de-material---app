package br.com.rpmont.conferencia.dtos;

import br.com.rpmont.conferencia.enums.SituacaoLoteFenoRacao;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ItemSaidaFenoRacaoResponseDTO(

        Long movimentacaoId,

        Integer loteId,

        String codigoLote,

        LocalDate validade,

        Integer quantidadeUnidades,

        BigDecimal pesoMovimentadoKg,

        Integer saldoAnterior,

        Integer saldoPosterior,

        SituacaoLoteFenoRacao situacaoLote

) {
}