package br.com.rpmont.conferencia.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UnidadeRequestDTO(

        @NotBlank(message = "O nome da unidade é obrigatório.")
        @Size(
                max = 100,
                message = "O nome da unidade deve possuir no máximo 100 caracteres."
        )
        String nome,

        @NotBlank(message = "A sigla da unidade é obrigatória.")
        @Size(
                max = 30,
                message = "A sigla da unidade deve possuir no máximo 30 caracteres."
        )
        String sigla

) {
}