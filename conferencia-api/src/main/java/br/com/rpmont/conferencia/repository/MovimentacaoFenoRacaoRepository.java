package br.com.rpmont.conferencia.repository;

import br.com.rpmont.conferencia.enums.SituacaoMovimentacaoFenoRacao;
import br.com.rpmont.conferencia.enums.TipoMovimentacaoFenoRacao;
import br.com.rpmont.conferencia.model.MovimentacaoFenoRacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface MovimentacaoFenoRacaoRepository
        extends JpaRepository<MovimentacaoFenoRacao, Long> {

    List<MovimentacaoFenoRacao>
    findByLoteIdOrderByDataOperacaoDescDataCadastroDesc(
            Integer loteId
    );

    List<MovimentacaoFenoRacao>
    findByProdutoIdAndUnidadeOrigemOrderByDataOperacaoDescDataCadastroDesc(
            Integer produtoId,
            String unidadeOrigem
    );

    List<MovimentacaoFenoRacao>
    findByUnidadeOrigemAndDataOperacaoBetweenOrderByDataOperacaoDescDataCadastroDesc(
            String unidadeOrigem,
            LocalDate dataInicial,
            LocalDate dataFinal
    );

    List<MovimentacaoFenoRacao>
    findByTipoMovimentacaoAndUnidadeOrigemAndDataOperacaoBetweenOrderByDataOperacaoDescDataCadastroDesc(
            TipoMovimentacaoFenoRacao tipoMovimentacao,
            String unidadeOrigem,
            LocalDate dataInicial,
            LocalDate dataFinal
    );

    List<MovimentacaoFenoRacao>
    findByUsuarioIdOrderByDataOperacaoDescDataCadastroDesc(
            Long usuarioId
    );

    List<MovimentacaoFenoRacao>
    findBySituacaoAndUnidadeOrigemOrderByDataOperacaoDescDataCadastroDesc(
            SituacaoMovimentacaoFenoRacao situacao,
            String unidadeOrigem
    );

    @Query("""
            SELECT m
            FROM MovimentacaoFenoRacao m
            WHERE (
                LOWER(m.unidadeOrigem) = LOWER(:unidade)
                OR LOWER(m.unidadeDestino) = LOWER(:unidade)
            )
            AND m.dataOperacao BETWEEN :dataInicial AND :dataFinal
            ORDER BY m.dataOperacao DESC, m.dataCadastro DESC
            """)
    List<MovimentacaoFenoRacao> consultarPorUnidadeEPeriodo(
            @Param("unidade")
            String unidade,

            @Param("dataInicial")
            LocalDate dataInicial,

            @Param("dataFinal")
            LocalDate dataFinal
    );

    @Query("""
            SELECT m
            FROM MovimentacaoFenoRacao m
            WHERE (
                LOWER(m.unidadeOrigem) = LOWER(:unidade)
                OR LOWER(m.unidadeDestino) = LOWER(:unidade)
            )
            AND m.tipoMovimentacao = :tipoMovimentacao
            AND m.dataOperacao BETWEEN :dataInicial AND :dataFinal
            ORDER BY m.dataOperacao DESC, m.dataCadastro DESC
            """)
    List<MovimentacaoFenoRacao> consultarPorTipoUnidadeEPeriodo(
            @Param("tipoMovimentacao")
            TipoMovimentacaoFenoRacao tipoMovimentacao,

            @Param("unidade")
            String unidade,

            @Param("dataInicial")
            LocalDate dataInicial,

            @Param("dataFinal")
            LocalDate dataFinal
    );
}