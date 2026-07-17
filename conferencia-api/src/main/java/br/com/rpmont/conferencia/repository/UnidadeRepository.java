package br.com.rpmont.conferencia.repository;

import br.com.rpmont.conferencia.model.Unidade;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UnidadeRepository extends JpaRepository<Unidade, Long> {

    boolean existsBySiglaIgnoreCase(String sigla);

    boolean existsBySiglaIgnoreCaseAndIdNot(String sigla, Long id);

    boolean existsByNomeIgnoreCase(String nome);

    boolean existsByNomeIgnoreCaseAndIdNot(String nome, Long id);

    Optional<Unidade> findBySiglaIgnoreCase(String sigla);

    List<Unidade> findAllByOrderByNomeAsc();

    List<Unidade> findByAtivoTrueOrderByNomeAsc();
}