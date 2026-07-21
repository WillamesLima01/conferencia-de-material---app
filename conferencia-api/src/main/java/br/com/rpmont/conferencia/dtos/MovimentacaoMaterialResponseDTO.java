package br.com.rpmont.conferencia.dtos;

import br.com.rpmont.conferencia.enums.SituacaoMaterial;
import br.com.rpmont.conferencia.enums.TipoMovimentacaoMaterial;

import java.time.LocalDateTime;

public record MovimentacaoMaterialResponseDTO(

        Long id,

        Long materialId,

        String numeroSerie,

        String nomeMaterial,

        String marcaMaterial,

        String descricaoMaterial,

        TipoMovimentacaoMaterial tipoMovimentacao,

        String setorOrigem,

        String setorDestino,

        String unidadeOrigem,

        String unidadeDestino,

        SituacaoMaterial situacaoAnterior,

        SituacaoMaterial situacaoNova,

        String motivo,

        String observacao,

        String numeroDocumento,

        Long usuarioId,

        String matriculaUsuario,

        String nomeUsuario,

        LocalDateTime dataMovimentacao

) {
}