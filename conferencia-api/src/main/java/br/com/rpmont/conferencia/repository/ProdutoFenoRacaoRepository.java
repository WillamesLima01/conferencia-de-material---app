package br.com.rpmont.conferencia.repository;

import br.com.rpmont.conferencia.enums.SituacaoProdutoFenoRacao;
import br.com.rpmont.conferencia.enums.TipoProdutoFenoRacao;
import br.com.rpmont.conferencia.model.ProdutoFenoRacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProdutoFenoRacaoRepository
        extends JpaRepository<ProdutoFenoRacao, Integer> {

    Optional<ProdutoFenoRacao> findByTipoProdutoAndPesoUnidadeKg(
            TipoProdutoFenoRacao tipoProduto,
            BigDecimal pesoUnidadeKg
    );

    boolean existsByTipoProdutoAndPesoUnidadeKg(
            TipoProdutoFenoRacao tipoProduto,
            BigDecimal pesoUnidadeKg
    );

    List<ProdutoFenoRacao>
    findBySituacaoOrderByTipoProdutoAscPesoUnidadeKgAsc(
            SituacaoProdutoFenoRacao situacao
    );

    List<ProdutoFenoRacao>
    findByTipoProdutoAndSituacaoOrderByPesoUnidadeKgAsc(
            TipoProdutoFenoRacao tipoProduto,
            SituacaoProdutoFenoRacao situacao
    );
}