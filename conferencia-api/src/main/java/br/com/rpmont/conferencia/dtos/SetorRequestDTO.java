package br.com.rpmont.conferencia.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SetorRequestDTO(

        @NotBlank(
                message = "O nome do setor é obrigatório."
        )
        @Size(
                max = 100,
                message = "O nome do setor deve possuir no máximo 100 caracteres."
        )
        String nome,

        @NotNull(
                message = "A unidade é obrigatória."
        )
        Long unidadeId
) {
}