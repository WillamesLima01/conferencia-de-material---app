package br.com.rpmont.conferencia.repository;

import br.com.rpmont.conferencia.enums.StatusSolicitacaoTransferenciaFenoRacao;
import br.com.rpmont.conferencia.model.SolicitacaoTransferenciaFenoRacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SolicitacaoTransferenciaFenoRacaoRepository
        extends JpaRepository<SolicitacaoTransferenciaFenoRacao, Long> {

    List<SolicitacaoTransferenciaFenoRacao>
    findByUnidadeOrigemAndStatusOrderByDataSolicitacaoAsc(
            String unidadeOrigem,
            StatusSolicitacaoTransferenciaFenoRacao status
    );

    List<SolicitacaoTransferenciaFenoRacao>
    findByUnidadeSolicitanteOrderByDataSolicitacaoDesc(
            String unidadeSolicitante
    );

    List<SolicitacaoTransferenciaFenoRacao>
    findByUnidadeOrigemOrderByDataSolicitacaoDesc(
            String unidadeOrigem
    );

    List<SolicitacaoTransferenciaFenoRacao>
    findByStatusOrderByDataSolicitacaoDesc(
            StatusSolicitacaoTransferenciaFenoRacao status
    );

    List<SolicitacaoTransferenciaFenoRacao>
    findBySolicitadoPorIdOrderByDataSolicitacaoDesc(
            Long solicitadoPorId
    );

    Optional<SolicitacaoTransferenciaFenoRacao>
    findByIdAndUnidadeOrigem(
            Long id,
            String unidadeOrigem
    );

    boolean existsByLoteSelecionado_IdAndStatus(
            Integer loteSelecionadoId,
            StatusSolicitacaoTransferenciaFenoRacao status
    );
}