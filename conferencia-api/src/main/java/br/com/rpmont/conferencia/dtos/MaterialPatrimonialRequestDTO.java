package br.com.rpmont.conferencia.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record MaterialPatrimonialRequestDTO(

        @NotBlank(message = "O número de série é obrigatório.")
        @Size(max = 100, message = "O número de série deve possuir no máximo 100 caracteres.")
        String numeroSerie,

        @Size(max = 100, message = "O nome deve possuir no máximo 100 caracteres.")
        String nome,

        @Size(max = 100, message = "A marca deve possuir no máximo 100 caracteres.")
        String marca,

        @NotBlank(message = "A descrição é obrigatória.")
        @Size(max = 300, message = "A descrição deve possuir no máximo 300 caracteres.")
        String descricao,

        @Size(max = 500, message = "A observação deve possuir no máximo 500 caracteres.")
        String observacao,

        @NotBlank(message = "O setor é obrigatório.")
        @Size(max = 50, message = "O setor deve possuir no máximo 50 caracteres.")
        String setor,

        Boolean conferido

) {
}