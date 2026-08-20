package br.com.rpmont.conferencia.service;

import br.com.rpmont.conferencia.dtos.PendenciasAdministrativasFenoRacaoResponseDTO;
import br.com.rpmont.conferencia.enums.SituacaoAnaliseExtravioFenoRacao;
import br.com.rpmont.conferencia.enums.StatusSolicitacaoTransferenciaFenoRacao;
import br.com.rpmont.conferencia.enums.TipoMovimentacaoFenoRacao;
import br.com.rpmont.conferencia.exception.BusinessException;
import br.com.rpmont.conferencia.exception.ForbiddenException;
import br.com.rpmont.conferencia.exception.ResourceNotFoundException;
import br.com.rpmont.conferencia.model.Usuario;
import br.com.rpmont.conferencia.repository.MovimentacaoFenoRacaoRepository;
import br.com.rpmont.conferencia.repository.SolicitacaoTransferenciaFenoRacaoRepository;
import br.com.rpmont.conferencia.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PendenciasAdministrativasFenoRacaoServiceImpl
        implements PendenciasAdministrativasFenoRacaoService {

    private static final int NIVEL_ADMIN_MASTER = 1;
    private static final int NIVEL_ADMIN = 2;

    private static final String STATUS_LIBERADO = "LIBERADO";

    private final MovimentacaoFenoRacaoRepository movimentacaoRepository;

    private final SolicitacaoTransferenciaFenoRacaoRepository
            solicitacaoTransferenciaRepository;

    private final UsuarioRepository usuarioRepository;

    @Override
    @Transactional(readOnly = true)
    public PendenciasAdministrativasFenoRacaoResponseDTO consultarResumo(
            String matriculaUsuario
    ) {

        Usuario usuarioLogado =
                buscarUsuarioAutenticado(
                        matriculaUsuario
                );

        validarAcessoAoModulo(
                usuarioLogado
        );

        validarUsuarioAdministrador(
                usuarioLogado
        );

        long extraviosPendentes;
        long transferenciasPendentes;

        /*
         * ==========================================
         * ADMIN MASTER
         * ==========================================
         *
         * Possui visão global.
         */
        if (
                usuarioLogado.getNivel() ==
                        NIVEL_ADMIN_MASTER
        ) {

            extraviosPendentes =
                    movimentacaoRepository
                            .countByTipoMovimentacaoAndSituacaoAnaliseExtravio(
                                    TipoMovimentacaoFenoRacao.EXTRAVIO,
                                    SituacaoAnaliseExtravioFenoRacao.PENDENTE_ANALISE
                            );

            transferenciasPendentes =
                    solicitacaoTransferenciaRepository
                            .countByStatus(
                                    StatusSolicitacaoTransferenciaFenoRacao.PENDENTE
                            );

        } else {

            /*
             * ==========================================
             * ADMIN
             * ==========================================
             *
             * Possui acesso somente às pendências
             * administrativas da própria unidade.
             */

            String unidadeUsuario =
                    usuarioLogado
                            .getUnidade()
                            .trim();

            extraviosPendentes =
                    movimentacaoRepository
                            .countByTipoMovimentacaoAndSituacaoAnaliseExtravioAndUnidadeOrigemIgnoreCase(
                                    TipoMovimentacaoFenoRacao.EXTRAVIO,
                                    SituacaoAnaliseExtravioFenoRacao.PENDENTE_ANALISE,
                                    unidadeUsuario
                            );

            transferenciasPendentes =
                    solicitacaoTransferenciaRepository
                            .countByUnidadeOrigemIgnoreCaseAndStatus(
                                    unidadeUsuario,
                                    StatusSolicitacaoTransferenciaFenoRacao.PENDENTE
                            );
        }

        long totalPendencias =
                extraviosPendentes +
                        transferenciasPendentes;

        return new PendenciasAdministrativasFenoRacaoResponseDTO(
                extraviosPendentes,
                transferenciasPendentes,
                totalPendencias,
                totalPendencias > 0
        );
    }

    /*
     * ==========================================
     * USUÁRIO AUTENTICADO
     * ==========================================
     */

    private Usuario buscarUsuarioAutenticado(
            String matriculaUsuario
    ) {

        if (
                matriculaUsuario == null ||
                        matriculaUsuario.isBlank()
        ) {
            throw new BusinessException(
                    "Usuário autenticado não identificado."
            );
        }

        return usuarioRepository
                .findByMatricula(
                        matriculaUsuario.trim()
                )
                .orElseThrow(
                        () -> new ResourceNotFoundException(
                                "Usuário autenticado não encontrado."
                        )
                );
    }

    /*
     * ==========================================
     * ACESSO AO MÓDULO
     * ==========================================
     */

    private void validarAcessoAoModulo(
            Usuario usuario
    ) {

        if (
                !Boolean.TRUE.equals(
                        usuario.getAtivo()
                )
        ) {
            throw new ForbiddenException(
                    "Usuário inativo."
            );
        }

        if (
                usuario.getStatusAcesso() == null ||
                        !STATUS_LIBERADO.equalsIgnoreCase(
                                usuario
                                        .getStatusAcesso()
                                        .trim()
                        )
        ) {
            throw new ForbiddenException(
                    "O acesso do usuário não está liberado."
            );
        }

        if (
                usuario.getUnidade() == null ||
                        usuario.getUnidade().isBlank()
        ) {
            throw new ForbiddenException(
                    "O usuário não possui unidade cadastrada."
            );
        }
    }

    /*
     * ==========================================
     * ACESSO ADMINISTRATIVO
     * ==========================================
     */

    private void validarUsuarioAdministrador(
            Usuario usuario
    ) {

        if (usuario.getNivel() == null) {
            throw new ForbiddenException(
                    "O usuário não possui nível de acesso cadastrado."
            );
        }

        if (
                usuario.getNivel() != NIVEL_ADMIN_MASTER &&
                        usuario.getNivel() != NIVEL_ADMIN
        ) {
            throw new ForbiddenException(
                    "Somente administradores podem consultar pendências administrativas."
            );
        }
    }
}