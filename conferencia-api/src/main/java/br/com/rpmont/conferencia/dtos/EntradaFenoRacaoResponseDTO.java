package br.com.rpmont.conferencia.dtos;

import br.com.rpmont.conferencia.enums.SituacaoLoteFenoRacao;
import br.com.rpmont.conferencia.enums.TipoProdutoFenoRacao;
import br.com.rpmont.conferencia.enums.UnidadeControleFenoRacao;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record EntradaFenoRacaoResponseDTO(

        Integer loteId,

        Integer produtoId,

        TipoProdutoFenoRacao tipoProduto,

        String nomeProduto,

        UnidadeControleFenoRacao unidadeControle,

        BigDecimal pesoUnidadeKg,

        String codigoLote,

        Integer quantidadeInicial,

        Integer quantidadeAtual,

        BigDecimal pesoTotalInicialKg,

        BigDecimal pesoTotalAtualKg,

        LocalDate dataEntrada,

        LocalDate validade,

        String fornecedor,

        String numeroDocumento,

        String responsavelRecebimento,

        String observacao,

        String unidade,

        SituacaoLoteFenoRacao situacao,

        Integer usuarioCadastroId,

        LocalDateTime dataCadastro

) {
}