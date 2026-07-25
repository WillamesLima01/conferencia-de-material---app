package br.com.rpmont.conferencia.dtos;

import br.com.rpmont.conferencia.enums.SituacaoProdutoFenoRacao;
import br.com.rpmont.conferencia.enums.TipoProdutoFenoRacao;
import br.com.rpmont.conferencia.enums.UnidadeControleFenoRacao;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ProdutoFenoRacaoResponseDTO(

        Integer id,

        TipoProdutoFenoRacao tipoProduto,

        String nomeProduto,

        UnidadeControleFenoRacao unidadeControle,

        BigDecimal pesoUnidadeKg,

        String descricao,

        SituacaoProdutoFenoRacao situacao,

        Integer usuarioCadastroId,

        LocalDateTime dataCadastro,

        Integer usuarioModificadorId,

        LocalDateTime dataModificacao

) {
}