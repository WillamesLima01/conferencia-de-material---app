package br.com.rpmont.conferencia.repository;

import br.com.rpmont.conferencia.enums.SituacaoTransferenciaFenoRacao;
import br.com.rpmont.conferencia.model.TransferenciaFenoRacao;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface TransferenciaFenoRacaoRepository
        extends JpaRepository<TransferenciaFenoRacao, Long> {

    Optional<TransferenciaFenoRacao> findBySolicitacaoId(
            Long solicitacaoId
    );

    boolean existsBySolicitacaoId(
            Long solicitacaoId
    );

    List<TransferenciaFenoRacao>
    findByUnidadeOrigemOrderByDataTransferenciaDesc(
            String unidadeOrigem
    );

    List<TransferenciaFenoRacao>
    findByUnidadeDestinoOrderByDataTransferenciaDesc(
            String unidadeDestino
    );

    List<TransferenciaFenoRacao>
    findByUnidadeOrigemOrUnidadeDestinoOrderByDataTransferenciaDesc(
            String unidadeOrigem,
            String unidadeDestino
    );

    List<TransferenciaFenoRacao>
    findBySituacaoOrderByDataTransferenciaDesc(
            SituacaoTransferenciaFenoRacao situacao
    );

    List<TransferenciaFenoRacao>
    findByDataTransferenciaBetweenOrderByDataTransferenciaDesc(
            LocalDateTime dataInicial,
            LocalDateTime dataFinal
    );

    List<TransferenciaFenoRacao>
    findByProdutoIdAndDataTransferenciaBetweenOrderByDataTransferenciaDesc(
            Integer produtoId,
            LocalDateTime dataInicial,
            LocalDateTime dataFinal
    );
}