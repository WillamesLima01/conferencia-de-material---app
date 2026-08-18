package br.com.rpmont.conferencia.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record AjustarExtravioFenoRacaoRequestDTO(

        @NotNull(
                message =
                        "A quantidade confirmada é obrigatória."
        )
        @Positive(
                message =
                        "A quantidade confirmada deve ser maior que zero."
        )
        Integer quantidadeConfirmada,

        @NotBlank(
                message =
                        "O motivo do ajuste é obrigatório."
        )
        @Size(
                max = 500,
                message =
                        "O motivo do ajuste deve possuir no máximo 500 caracteres."
        )
        String motivo

) {
}