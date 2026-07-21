package br.com.rpmont.conferencia.dtos;

import br.com.rpmont.conferencia.enums.TipoMovimentacaoMaterial;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record MovimentacaoMaterialRequestDTO(

        @NotNull(message = "O tipo da movimentação é obrigatório.")
        TipoMovimentacaoMaterial tipoMovimentacao,

        @Size(
                max = 50,
                message = "O setor de destino deve possuir no máximo 50 caracteres."
        )
        String setorDestino,

        @Size(
                max = 50,
                message = "A unidade de destino deve possuir no máximo 50 caracteres."
        )
        String unidadeDestino,

        @Size(
                max = 300,
                message = "O motivo deve possuir no máximo 300 caracteres."
        )
        String motivo,

        @Size(
                max = 500,
                message = "A observação deve possuir no máximo 500 caracteres."
        )
        String observacao,

        @Size(
                max = 150,
                message = "O número do documento deve possuir no máximo 150 caracteres."
        )
        String numeroDocumento

) {
}