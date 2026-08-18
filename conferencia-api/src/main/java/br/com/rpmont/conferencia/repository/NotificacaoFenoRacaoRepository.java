package br.com.rpmont.conferencia.repository;

import br.com.rpmont.conferencia.enums.TipoNotificacaoFenoRacao;
import br.com.rpmont.conferencia.model.NotificacaoFenoRacao;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificacaoFenoRacaoRepository
        extends JpaRepository<NotificacaoFenoRacao, Long> {

    /*
     * ==========================================
     * NOTIFICAÇÕES GERAIS DA UNIDADE
     * ==========================================
     */

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

    /*
     * ==========================================
     * NOTIFICAÇÕES GERAIS SEM DESTINATÁRIO
     * INDIVIDUAL
     * ==========================================
     */

    List<NotificacaoFenoRacao>
    findByUnidadeDestinoAndUsuarioDestinoIdIsNullOrderByDataCriacaoDesc(
            String unidadeDestino
    );

    List<NotificacaoFenoRacao>
    findByUnidadeDestinoAndUsuarioDestinoIdIsNullAndLidaOrderByDataCriacaoDesc(
            String unidadeDestino,
            Boolean lida
    );

    long countByUnidadeDestinoAndUsuarioDestinoIdIsNullAndLida(
            String unidadeDestino,
            Boolean lida
    );

    /*
     * ==========================================
     * NOTIFICAÇÕES INDIVIDUAIS
     * ==========================================
     */

    List<NotificacaoFenoRacao>
    findByUsuarioDestinoIdOrderByDataCriacaoDesc(
            Long usuarioDestinoId
    );

    List<NotificacaoFenoRacao>
    findByUsuarioDestinoIdAndLidaOrderByDataCriacaoDesc(
            Long usuarioDestinoId,
            Boolean lida
    );

    long countByUsuarioDestinoIdAndLida(
            Long usuarioDestinoId,
            Boolean lida
    );

    /*
     * ==========================================
     * OUTRAS CONSULTAS
     * ==========================================
     */

    List<NotificacaoFenoRacao>
    findBySolicitacaoIdOrderByDataCriacaoDesc(
            Long solicitacaoId
    );

    List<NotificacaoFenoRacao>
    findByMovimentacaoIdAndLida(
            Long movimentacaoId,
            Boolean lida
    );

    List<NotificacaoFenoRacao>
    findByLidaOrderByDataCriacaoDesc(
            Boolean lida
    );

    long countByLida(
            Boolean lida
    );
}