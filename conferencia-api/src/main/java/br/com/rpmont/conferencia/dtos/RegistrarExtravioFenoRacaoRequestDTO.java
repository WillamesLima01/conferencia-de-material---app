package br.com.rpmont.conferencia.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record RegistrarExtravioFenoRacaoRequestDTO(

        @NotNull(message = "O lote é obrigatório.")
        Integer loteId,

        @NotNull(message = "A quantidade extraviada é obrigatória.")
        @Positive(message = "A quantidade extraviada deve ser maior que zero.")
        Integer quantidadeExtraviada,

        @NotNull(message = "A data do extravio é obrigatória.")
        LocalDate dataExtravio,

        @NotBlank(message = "O motivo do extravio é obrigatório.")
        @Size(
                max = 250,
                message = "O motivo deve possuir no máximo 250 caracteres."
        )
        String motivo,

        @NotBlank(message = "O responsável pelo registro é obrigatório.")
        @Size(
                max = 150,
                message = "O responsável deve possuir no máximo 150 caracteres."
        )
        String responsavel,

        @Size(
                max = 100,
                message = "O número do documento deve possuir no máximo 100 caracteres."
        )
        String numeroDocumento,

        @Size(
                max = 500,
                message = "A observação deve possuir no máximo 500 caracteres."
        )
        String observacao

) {
}