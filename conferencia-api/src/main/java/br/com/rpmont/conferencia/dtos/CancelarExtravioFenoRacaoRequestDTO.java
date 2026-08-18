package br.com.rpmont.conferencia.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CancelarExtravioFenoRacaoRequestDTO(

        @NotBlank(
                message =
                        "O motivo do cancelamento é obrigatório."
        )
        @Size(
                max = 500,
                message =
                        "O motivo do cancelamento deve possuir no máximo 500 caracteres."
        )
        String motivo

) {
}