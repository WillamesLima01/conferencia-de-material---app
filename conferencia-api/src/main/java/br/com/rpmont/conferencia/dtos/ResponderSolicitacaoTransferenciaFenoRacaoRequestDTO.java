package br.com.rpmont.conferencia.dtos;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ResponderSolicitacaoTransferenciaFenoRacaoRequestDTO(

        @NotNull(message = "A decisão da solicitação é obrigatória.")
        Boolean aprovar,

        @Size(
                max = 500,
                message = "A observação da resposta deve possuir no máximo 500 caracteres."
        )
        String observacaoResposta

) {
}