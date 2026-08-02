package br.com.rpmont.conferencia.repository;

import br.com.rpmont.conferencia.model.ItemSolicitacaoTransferenciaFenoRacao;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ItemSolicitacaoTransferenciaFenoRacaoRepository
        extends JpaRepository<
        ItemSolicitacaoTransferenciaFenoRacao,
        Long
        > {

    List<ItemSolicitacaoTransferenciaFenoRacao>
    findBySolicitacaoIdOrderByOrdemAtendimentoAsc(
            Long solicitacaoId
    );

    List<ItemSolicitacaoTransferenciaFenoRacao>
    findByTransferenciaIdOrderByOrdemAtendimentoAsc(
            Long transferenciaId
    );

    void deleteBySolicitacaoId(
            Long solicitacaoId
    );
}