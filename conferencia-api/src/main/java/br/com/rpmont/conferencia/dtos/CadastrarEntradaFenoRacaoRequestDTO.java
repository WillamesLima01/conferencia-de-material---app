package br.com.rpmont.conferencia.dtos;

import br.com.rpmont.conferencia.enums.TipoProdutoFenoRacao;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CadastrarEntradaFenoRacaoRequestDTO(

        @NotNull(message = "O tipo do produto é obrigatório.")
        TipoProdutoFenoRacao tipoProduto,

        @NotNull(message = "O peso por unidade é obrigatório.")
        @DecimalMin(
                value = "0.01",
                message = "O peso por unidade deve ser maior que zero."
        )
        BigDecimal pesoUnidadeKg,

        @NotNull(message = "A quantidade de entrada é obrigatória.")
        @Positive(message = "A quantidade de entrada deve ser maior que zero.")
        Integer quantidadeInicial,

        @NotNull(message = "A data da entrada é obrigatória.")
        LocalDate dataEntrada,

        @Size(
                max = 100,
                message = "O código do lote deve possuir no máximo 100 caracteres."
        )
        String codigoLote,

        @Size(
                max = 150,
                message = "O fornecedor deve possuir no máximo 150 caracteres."
        )
        String fornecedor,

        LocalDate validade,

        @Size(
                max = 100,
                message = "O número do documento deve possuir no máximo 100 caracteres."
        )
        String numeroDocumento,

        @NotBlank(message = "O responsável pelo recebimento é obrigatório.")
        @Size(
                max = 150,
                message = "O responsável deve possuir no máximo 150 caracteres."
        )
        String responsavelRecebimento,

        @Size(
                max = 500,
                message = "A observação deve possuir no máximo 500 caracteres."
        )
        String observacao,

        @Size(
                max = 50,
                message = "A unidade deve possuir no máximo 50 caracteres."
        )
        String unidade

) {
}