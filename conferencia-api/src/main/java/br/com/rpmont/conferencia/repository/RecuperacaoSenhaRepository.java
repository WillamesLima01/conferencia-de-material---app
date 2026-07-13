package br.com.rpmont.conferencia.repository;

import br.com.rpmont.conferencia.model.RecuperacaoSenha;
import br.com.rpmont.conferencia.model.Usuario;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RecuperacaoSenhaRepository
        extends JpaRepository<RecuperacaoSenha, Long> {

    Optional<RecuperacaoSenha>
    findTopByUsuarioAndUtilizadoFalseOrderByDataCriacaoDesc(
            Usuario usuario
    );

    List<RecuperacaoSenha>
    findAllByUsuarioAndUtilizadoFalse(
            Usuario usuario
    );
}