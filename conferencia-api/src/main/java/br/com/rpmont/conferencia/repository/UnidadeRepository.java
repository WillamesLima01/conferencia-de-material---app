package br.com.rpmont.conferencia.repository;

import br.com.rpmont.conferencia.model.Unidade;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UnidadeRepository
        extends JpaRepository<Unidade, Long> {

    boolean existsBySiglaIgnoreCase(String sigla);

    boolean existsByNomeIgnoreCase(String nome);

    boolean existsBySiglaIgnoreCaseAndIdNot(String sigla, Long id);

    boolean existsByNomeIgnoreCaseAndIdNot(String nome, Long id);

    boolean existsBySiglaIgnoreCaseAndAtivoTrue(String sigla);

    Optional<Unidade> findBySiglaIgnoreCase(String sigla);

    Optional<Unidade> findByNomeIgnoreCase(String nome);

    List<Unidade> findAllByOrderByNomeAsc();

    List<Unidade> findByAtivoTrueOrderByNomeAsc();
}