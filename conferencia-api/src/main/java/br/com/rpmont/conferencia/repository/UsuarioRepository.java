package br.com.rpmont.conferencia.repository;

import br.com.rpmont.conferencia.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UsuarioRepository
        extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByMatricula(
            String matricula
    );

    Optional<Usuario> findByEmail(
            String email
    );

    List<Usuario> findByUnidade(
            String unidade
    );

    boolean existsByMatricula(
            String matricula
    );

    boolean existsByEmail(
            String email
    );

    /*
     * ==========================================
     * ADMINISTRADORES RESPONSÁVEIS PELO
     * RECEBIMENTO DE NOTIFICAÇÕES DE EXTRAVIO
     * ==========================================
     *
     * Regras:
     *
     * - mesma unidade do extravio;
     * - nível 2 (ADMIN);
     * - usuário ativo;
     * - acesso LIBERADO;
     * - setor P4 OU Fiscal-de-dia.
     */

    @Query("""
            SELECT u
            FROM Usuario u
            WHERE LOWER(TRIM(u.unidade)) = LOWER(TRIM(:unidade))
              AND u.nivel = 2
              AND u.ativo = true
              AND LOWER(TRIM(u.statusAcesso)) = 'liberado'
              AND (
                    LOWER(TRIM(u.setor)) = 'p4'
                    OR LOWER(TRIM(u.setor)) = 'fiscal-de-dia'
                  )
            """)
    List<Usuario> buscarAdministradoresResponsaveisPorExtravio(
            @Param("unidade")
            String unidade
    );
}