package br.com.rpmont.conferencia.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CancelarMovimentacaoFenoRacaoRequestDTO(

        @NotBlank(message = "O motivo do cancelamento é obrigatório.")
        @Size(
                max = 250,
                message = "O motivo do cancelamento deve possuir no máximo 250 caracteres."
        )
        String motivo,

        @Size(
                max = 500,
                message = "A observação deve possuir no máximo 500 caracteres."
        )
        String observacao

) {
}