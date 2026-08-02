package br.com.rpmont.conferencia.dtos;

import jakarta.validation.constraints.Size;

public record AprovarSolicitacaoTransferenciaFenoRacaoRequestDTO(

        @Size(
                max = 500,
                message = "A observação deve possuir no máximo 500 caracteres."
        )
        String observacao

) {
}