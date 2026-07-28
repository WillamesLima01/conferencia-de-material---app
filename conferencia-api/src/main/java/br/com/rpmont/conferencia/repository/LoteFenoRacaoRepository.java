package br.com.rpmont.conferencia.repository;

import br.com.rpmont.conferencia.enums.SituacaoLoteFenoRacao;
import br.com.rpmont.conferencia.model.LoteFenoRacao;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LoteFenoRacaoRepository
        extends JpaRepository<LoteFenoRacao, Integer> {

    List<LoteFenoRacao> findByUnidadeOrderByDataEntradaDesc(
            String unidade
    );

    List<LoteFenoRacao> findByUnidadeAndSituacaoOrderByDataEntradaAsc(
            String unidade,
            SituacaoLoteFenoRacao situacao
    );

    List<LoteFenoRacao>
    findByProdutoIdAndUnidadeAndSituacaoOrderByDataEntradaAsc(
            Integer produtoId,
            String unidade,
            SituacaoLoteFenoRacao situacao
    );

    List<LoteFenoRacao>
    findByProdutoIdAndUnidadeAndSituacaoAndQuantidadeAtualGreaterThanOrderByDataEntradaAsc(
            Integer produtoId,
            String unidade,
            SituacaoLoteFenoRacao situacao,
            Integer quantidadeAtual
    );

    List<LoteFenoRacao> findByProdutoIdAndUnidadeOrderByDataEntradaDesc(
            Integer produtoId,
            String unidade
    );

    Optional<LoteFenoRacao> findByIdAndUnidade(
            Integer id,
            String unidade
    );

    Optional<LoteFenoRacao> findByIdAndUnidadeAndSituacao(
            Integer id,
            String unidade,
            SituacaoLoteFenoRacao situacao
    );

    boolean existsByCodigoLoteAndProdutoIdAndUnidade(
            String codigoLote,
            Integer produtoId,
            String unidade
    );

    boolean existsByProdutoId(
            Integer produtoId
    );

    boolean existsByProdutoIdAndQuantidadeAtualGreaterThan(
            Integer produtoId,
            Integer quantidadeAtual
    );
}