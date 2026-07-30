package br.com.rpmont.conferencia.dtos;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record AprovarSolicitacaoTransferenciaFenoRacaoRequestDTO(

        @NotNull(
                message = "O lote de origem é obrigatório."
        )
        @Positive(
                message = "O ID do lote de origem deve ser maior que zero."
        )
        Integer loteOrigemId,

        @NotNull(
                message = "A quantidade aprovada é obrigatória."
        )
        @Positive(
                message = "A quantidade aprovada deve ser maior que zero."
        )
        Integer quantidadeAprovada,

        @Size(
                max = 500,
                message = "A observação deve possuir no máximo 500 caracteres."
        )
        String observacao

) {
}