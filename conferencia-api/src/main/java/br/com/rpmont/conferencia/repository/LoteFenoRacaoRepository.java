package br.com.rpmont.conferencia.repository;

import br.com.rpmont.conferencia.enums.SituacaoLoteFenoRacao;
import br.com.rpmont.conferencia.model.LoteFenoRacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
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

    /*
     * ==========================================
     * LOTES ELEGÍVEIS PARA TRANSFERÊNCIA
     * ==========================================
     *
     * Ordem aplicada:
     *
     * 1. Lotes com validade informada;
     * 2. Validade mais próxima;
     * 3. Data de entrada mais antiga;
     * 4. Data de cadastro mais antiga;
     * 5. Menor ID.
     *
     * Lotes vencidos, inativos ou sem saldo
     * não participam da distribuição.
     */
    @Query("""
            SELECT lote
            FROM LoteFenoRacao lote
            WHERE lote.produto.id = :produtoId
              AND LOWER(lote.unidade) = LOWER(:unidade)
              AND lote.situacao = :situacao
              AND lote.quantidadeAtual > 0
              AND (
                    lote.validade IS NULL
                    OR lote.validade >= :hoje
              )
            ORDER BY
              CASE
                  WHEN lote.validade IS NULL THEN 1
                  ELSE 0
              END,
              lote.validade ASC,
              lote.dataEntrada ASC,
              lote.dataCadastro ASC,
              lote.id ASC
            """)
    List<LoteFenoRacao> buscarLotesElegiveisOrdenados(
            @Param("produtoId")
            Integer produtoId,

            @Param("unidade")
            String unidade,

            @Param("situacao")
            SituacaoLoteFenoRacao situacao,

            @Param("hoje")
            LocalDate hoje
    );
}