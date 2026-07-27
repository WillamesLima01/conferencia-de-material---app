package br.com.rpmont.conferencia.dtos;

import br.com.rpmont.conferencia.enums.TipoProdutoFenoRacao;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record FiltroRelatorioFenoRacaoDTO(

        LocalDate dataInicial,

        LocalDate dataFinal,

        TipoProdutoFenoRacao tipoProduto,

        @DecimalMin(
                value = "0.01",
                message = "O peso por unidade deve ser maior que zero."
        )
        BigDecimal pesoUnidadeKg,

        @Size(
                max = 50,
                message = "A unidade deve possuir no máximo 50 caracteres."
        )
        String unidade

) {
}