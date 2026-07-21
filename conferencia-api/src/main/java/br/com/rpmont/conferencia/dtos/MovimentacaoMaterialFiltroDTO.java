package br.com.rpmont.conferencia.dtos;

import br.com.rpmont.conferencia.enums.SituacaoMaterial;
import br.com.rpmont.conferencia.enums.TipoMovimentacaoMaterial;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

public record MovimentacaoMaterialFiltroDTO(

        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
        LocalDate dataInicial,

        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
        LocalDate dataFinal,

        TipoMovimentacaoMaterial tipoMovimentacao,

        Long materialId,

        String numeroSerie,

        String nome,

        String marca,

        String descricao,

        String setor,

        String unidade,

        String numeroDocumento,

        Long usuarioId,

        SituacaoMaterial situacaoAnterior,

        SituacaoMaterial situacaoNova

) {
}