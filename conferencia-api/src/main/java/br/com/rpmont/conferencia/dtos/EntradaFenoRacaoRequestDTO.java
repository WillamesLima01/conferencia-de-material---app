package br.com.rpmont.conferencia.dtos;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.LocalDate;

public record EntradaFenoRacaoRequestDTO(

        @NotNull(message = "O produto é obrigatório.")
        Integer produtoId,

        String codigoLote,

        @NotNull(message = "A quantidade é obrigatória.")
        @Positive(message = "A quantidade deve ser maior que zero.")
        Integer quantidade,

        @NotNull(message = "A data de entrada é obrigatória.")
        LocalDate dataEntrada,

        @FutureOrPresent(message = "A validade não pode ser anterior à data atual.")
        LocalDate validade,

        String fornecedor,

        String numeroDocumento,

        @NotBlank(message = "O responsável pelo recebimento é obrigatório.")
        String responsavelRecebimento,

        String observacao

) {
}