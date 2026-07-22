package br.com.rpmont.conferencia.repository;

import br.com.rpmont.conferencia.enums.SituacaoMaterial;
import br.com.rpmont.conferencia.model.MaterialPatrimonial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface MaterialPatrimonialRepository
        extends JpaRepository<MaterialPatrimonial, Long> {

    Optional<MaterialPatrimonial> findByNumeroSerieIgnoreCase(
            String numeroSerie
    );

    boolean existsByNumeroSerieIgnoreCase(
            String numeroSerie
    );

    List<MaterialPatrimonial> findByUnidadeIgnoreCase(
            String unidade
    );

    List<MaterialPatrimonial> findByUnidadeIgnoreCaseAndSituacaoIgnoreCase(
            String unidade,
            String situacao
    );

    List<MaterialPatrimonial> findBySetorIgnoreCaseAndUnidadeIgnoreCase(
            String setor,
            String unidade
    );

    /*
     * ==========================================
     * ZERAR CONFERÊNCIA DA UNIDADE
     * ==========================================
     */

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(
            """
            update MaterialPatrimonial material
               set material.conferido = false,
                   material.dataModificacao = :dataModificacao,
                   material.usuarioModificadorId = :usuarioModificadorId
             where upper(material.unidade) = upper(:unidade)
               and material.situacao = :situacao
               and material.conferido = true
            """
    )
    int zerarConferenciaDaUnidade(
            @Param("unidade")
            String unidade,

            @Param("situacao")
            SituacaoMaterial situacao,

            @Param("dataModificacao")
            LocalDateTime dataModificacao,

            @Param("usuarioModificadorId")
            Long usuarioModificadorId
    );

    /*
     * ==========================================
     * ZERAR CONFERÊNCIA DA UNIDADE E DO SETOR
     * ==========================================
     */

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(
            """
            update MaterialPatrimonial material
               set material.conferido = false,
                   material.dataModificacao = :dataModificacao,
                   material.usuarioModificadorId = :usuarioModificadorId
             where upper(material.unidade) = upper(:unidade)
               and upper(material.setor) = upper(:setor)
               and material.situacao = :situacao
               and material.conferido = true
            """
    )
    int zerarConferenciaDaUnidadeESetor(
            @Param("unidade")
            String unidade,

            @Param("setor")
            String setor,

            @Param("situacao")
            SituacaoMaterial situacao,

            @Param("dataModificacao")
            LocalDateTime dataModificacao,

            @Param("usuarioModificadorId")
            Long usuarioModificadorId
    );
}