package br.com.rpmont.conferencia.dtos;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record RegistrarSaidaFenoRacaoRequestDTO(

        @NotNull(message = "O lote é obrigatório.")
        Integer loteId,

        @NotNull(message = "A quantidade necessária em quilogramas é obrigatória.")
        @DecimalMin(
                value = "0.01",
                message = "A quantidade necessária deve ser maior que zero."
        )
        BigDecimal quantidadeNecessariaKg,

        @NotNull(message = "A data da saída é obrigatória.")
        LocalDate dataSaida,

        @NotBlank(message = "O serviço é obrigatório.")
        @Size(
                max = 150,
                message = "O serviço deve possuir no máximo 150 caracteres."
        )
        String servico,

        @NotBlank(message = "O responsável pela retirada é obrigatório.")
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