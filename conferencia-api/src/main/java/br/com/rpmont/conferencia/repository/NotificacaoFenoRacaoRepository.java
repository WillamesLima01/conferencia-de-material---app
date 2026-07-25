package br.com.rpmont.conferencia.repository;

import br.com.rpmont.conferencia.enums.TipoNotificacaoFenoRacao;
import br.com.rpmont.conferencia.model.NotificacaoFenoRacao;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificacaoFenoRacaoRepository
        extends JpaRepository<NotificacaoFenoRacao, Long> {

    List<NotificacaoFenoRacao>
    findByUnidadeDestinoOrderByDataCriacaoDesc(
            String unidadeDestino
    );

    List<NotificacaoFenoRacao>
    findByUnidadeDestinoAndLidaOrderByDataCriacaoDesc(
            String unidadeDestino,
            Boolean lida
    );

    List<NotificacaoFenoRacao>
    findByUnidadeDestinoAndTipoOrderByDataCriacaoDesc(
            String unidadeDestino,
            TipoNotificacaoFenoRacao tipo
    );

    long countByUnidadeDestinoAndLida(
            String unidadeDestino,
            Boolean lida
    );

    List<NotificacaoFenoRacao>
    findBySolicitacaoIdOrderByDataCriacaoDesc(
            Long solicitacaoId
    );
}