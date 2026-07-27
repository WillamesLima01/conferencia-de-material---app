package br.com.rpmont.conferencia.dtos;

import br.com.rpmont.conferencia.enums.TipoProdutoFenoRacao;

import java.math.BigDecimal;

public record ResumoProdutoFenoRacaoDTO(

        TipoProdutoFenoRacao tipo,

        String nome,

        Integer saldoUnidades,

        BigDecimal saldoKg,

        BigDecimal saidaKg,

        BigDecimal extravioKg,

        BigDecimal transferenciaGeralKg,

        BigDecimal transferenciaRecebidaKg,

        BigDecimal transferenciaEnviadaKg

) {
}