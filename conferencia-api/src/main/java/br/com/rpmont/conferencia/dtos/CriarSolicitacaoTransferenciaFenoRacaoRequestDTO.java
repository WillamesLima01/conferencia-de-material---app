package br.com.rpmont.conferencia.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record CriarSolicitacaoTransferenciaFenoRacaoRequestDTO(

        @NotNull(message = "O lote solicitado é obrigatório.")
        Integer loteSolicitadoId,

        @NotNull(message = "A quantidade solicitada é obrigatória.")
        @Positive(message = "A quantidade solicitada deve ser maior que zero.")
        Integer quantidadeSolicitada,

        @NotBlank(message = "A justificativa da solicitação é obrigatória.")
        @Size(
                max = 500,
                message = "A justificativa deve possuir no máximo 500 caracteres."
        )
        String justificativa

) {
}