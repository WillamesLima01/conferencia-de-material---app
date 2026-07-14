package br.com.rpmont.conferencia.repository;

import br.com.rpmont.conferencia.model.MaterialPatrimonial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MaterialPatrimonialRepository extends JpaRepository<MaterialPatrimonial, Long> {

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
}