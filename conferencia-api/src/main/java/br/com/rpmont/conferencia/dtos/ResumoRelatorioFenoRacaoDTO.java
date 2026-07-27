package br.com.rpmont.conferencia.dtos;

import java.math.BigDecimal;

public record ResumoRelatorioFenoRacaoDTO(

        Integer totalEntradaUnidades,

        BigDecimal totalEntradaKg,

        Integer totalSaidaUnidades,

        BigDecimal totalSaidaKg,

        Integer totalExtravioUnidades,

        BigDecimal totalExtravioKg,

        Integer totalTransferenciaGeralUnidades,

        BigDecimal totalTransferenciaGeralKg,

        Integer totalTransferenciaRecebidaUnidades,

        BigDecimal totalTransferenciaRecebidaKg,

        Integer totalTransferenciaEnviadaUnidades,

        BigDecimal totalTransferenciaEnviadaKg,

        Integer saldoAtualUnidades,

        BigDecimal saldoAtualKg

) {
}