package br.com.rpmont.conferencia.dtos;

import jakarta.validation.constraints.NotBlank;

public record TransferirConferirMaterialRequestDTO(

        @NotBlank(message = "O novo setor é obrigatório")
        String novoSetor,

        @NotBlank(message = "A unidade é obrigatória")
        String unidade

) {
}