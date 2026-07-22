package br.com.rpmont.conferencia.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record ZerarConferenciaRequestDTO(

        @NotBlank(message = "A senha do administrador é obrigatória.")
        String senha,

        @NotBlank(message = "O tipo de zeramento é obrigatório.")
        @Pattern(
                regexp = "TODOS|SETOR",
                message = "O tipo de zeramento deve ser TODOS ou SETOR."
        )
        String tipo,

        String setor

) {
}