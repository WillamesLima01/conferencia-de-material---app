package br.com.rpmont.conferencia.repository;

import br.com.rpmont.conferencia.enums.SituacaoMovimentacaoFenoRacao;
import br.com.rpmont.conferencia.enums.TipoMovimentacaoFenoRacao;
import br.com.rpmont.conferencia.model.MovimentacaoFenoRacao;
import org.springframework.data.jpa.repository.JpaRepository;
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
            Integer usuarioId
    );

    List<MovimentacaoFenoRacao>
    findBySituacaoAndUnidadeOrigemOrderByDataOperacaoDescDataCadastroDesc(
            SituacaoMovimentacaoFenoRacao situacao,
            String unidadeOrigem
    );
}