package br.com.rpmont.conferencia.dtos;

import jakarta.validation.constraints.NotBlank;

public record LoginRequestDTO(

        @NotBlank(message = "A matrícula é obrigatória.")
        String matricula,

        @NotBlank(message = "A senha é obrigatória.")
        String senha
) {
}
