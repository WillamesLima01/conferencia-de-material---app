package br.com.rpmont.conferencia.repository;

import br.com.rpmont.conferencia.model.Setor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SetorRepository extends JpaRepository<Setor, Long> {

    boolean existsByNomeIgnoreCaseAndUnidadeId(String nome, Long unidadeId);

    boolean existsByNomeIgnoreCaseAndUnidadeIdAndIdNot(String nome, Long unidadeId, Long id);

    List<Setor> findAllByOrderByUnidadeNomeAscNomeAsc();

    List<Setor> findByAtivoTrueOrderByUnidadeNomeAscNomeAsc();

    List<Setor> findByUnidadeIdOrderByNomeAsc(Long unidadeId);

    List<Setor> findByUnidadeIdAndAtivoTrueOrderByNomeAsc(Long unidadeId);

    boolean existsByUnidadeIdAndAtivoTrue(Long unidadeId);
}