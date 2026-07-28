package br.com.rpmont.conferencia.dtos;

import br.com.rpmont.conferencia.enums.TipoProdutoFenoRacao;
import br.com.rpmont.conferencia.enums.UnidadeControleFenoRacao;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record SaidaFenoRacaoResponseDTO(

        Integer produtoId,

        TipoProdutoFenoRacao tipoProduto,

        String nomeProduto,

        UnidadeControleFenoRacao unidadeControle,

        BigDecimal pesoUnidadeKg,

        BigDecimal quantidadeSolicitadaKg,

        Integer quantidadeTotalUnidades,

        BigDecimal pesoTotalMovimentadoKg,

        BigDecimal sobraTotalCalculadaKg,

        String servico,

        String motivo,

        String observacao,

        String numeroDocumento,

        String responsavel,

        String unidade,

        Long usuarioId,

        LocalDate dataOperacao,

        LocalDateTime dataCadastro,

        List<ItemSaidaFenoRacaoResponseDTO> lotesMovimentados

) {
}