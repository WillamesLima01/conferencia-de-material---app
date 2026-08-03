package br.com.rpmont.conferencia.dtos;

import br.com.rpmont.conferencia.enums.TipoProdutoFenoRacao;
import br.com.rpmont.conferencia.enums.UnidadeControleFenoRacao;

import java.math.BigDecimal;

public record ResumoEstoqueTransferenciaDTO(

        Integer produtoId,

        TipoProdutoFenoRacao tipoProduto,

        String nomeProduto,

        UnidadeControleFenoRacao unidadeControle,

        BigDecimal pesoUnidadeKg,

        String unidade,

        Integer quantidadeDisponivel,

        BigDecimal pesoTotalDisponivelKg,

        Integer quantidadeLotes

) {
}