package br.com.rpmont.conferencia.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record BaixarMaterialRequestDTO(

        @NotBlank(message = "O motivo da baixa é obrigatório.")
        @Size(
                max = 300,
                message = "O motivo deve possuir no máximo 300 caracteres."
        )
        String motivo,

        @NotBlank(message = "O número do documento é obrigatório.")
        @Size(
                max = 150,
                message = "O número do documento deve possuir no máximo 150 caracteres."
        )
        String numeroDocumento,

        @Size(
                max = 500,
                message = "A observação deve possuir no máximo 500 caracteres."
        )
        String observacao

) {
}