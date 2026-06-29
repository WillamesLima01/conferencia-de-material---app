package br.com.rpmont.conferencia.repository;

import br.com.rpmont.conferencia.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByMatricula(String matricula);
    Optional<Usuario> findByEmail(String email);
    boolean existByMatricula(String matricula);
    boolean existByEmail(String email);
}
