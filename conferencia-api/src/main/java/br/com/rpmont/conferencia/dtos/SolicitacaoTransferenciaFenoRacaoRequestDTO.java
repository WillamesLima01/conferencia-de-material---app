package br.com.rpmont.conferencia.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record SolicitacaoTransferenciaFenoRacaoRequestDTO(

        @NotNull(message = "O produto é obrigatório.")
        @Positive(message = "O ID do produto deve ser maior que zero.")
        Integer produtoId,

        @NotBlank(message = "A unidade de origem é obrigatória.")
        @Size(
                max = 50,
                message = "A unidade de origem deve possuir no máximo 50 caracteres."
        )
        String unidadeOrigem,

        @NotNull(message = "A quantidade solicitada é obrigatória.")
        @Positive(message = "A quantidade solicitada deve ser maior que zero.")
        Integer quantidadeSolicitada,

        @NotBlank(message = "A justificativa é obrigatória.")
        @Size(
                max = 500,
                message = "A justificativa deve possuir no máximo 500 caracteres."
        )
        String justificativa

) {
}