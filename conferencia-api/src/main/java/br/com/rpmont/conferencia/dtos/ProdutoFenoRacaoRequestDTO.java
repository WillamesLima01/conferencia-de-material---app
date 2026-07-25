package br.com.rpmont.conferencia.dtos;

import br.com.rpmont.conferencia.enums.TipoProdutoFenoRacao;
import br.com.rpmont.conferencia.enums.UnidadeControleFenoRacao;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record ProdutoFenoRacaoRequestDTO(

        @NotNull(message = "O tipo do produto é obrigatório.")
        TipoProdutoFenoRacao tipoProduto,

        @NotBlank(message = "O nome do produto é obrigatório.")
        @Size(
                max = 100,
                message = "O nome do produto deve possuir no máximo 100 caracteres."
        )
        String nomeProduto,

        @NotNull(message = "A unidade de controle é obrigatória.")
        UnidadeControleFenoRacao unidadeControle,

        @NotNull(message = "O peso por unidade é obrigatório.")
        @DecimalMin(
                value = "0.01",
                message = "O peso por unidade deve ser maior que zero."
        )
        BigDecimal pesoUnidadeKg,

        @Size(
                max = 300,
                message = "A descrição deve possuir no máximo 300 caracteres."
        )
        String descricao

) {
}