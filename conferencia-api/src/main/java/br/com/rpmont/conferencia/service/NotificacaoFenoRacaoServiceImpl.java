package br.com.rpmont.conferencia.service;

import br.com.rpmont.conferencia.dtos.MarcarNotificacaoLidaResponseDTO;
import br.com.rpmont.conferencia.dtos.NotificacaoFenoRacaoResponseDTO;
import br.com.rpmont.conferencia.exception.BusinessException;
import br.com.rpmont.conferencia.exception.ForbiddenException;
import br.com.rpmont.conferencia.exception.ResourceNotFoundException;
import br.com.rpmont.conferencia.model.NotificacaoFenoRacao;
import br.com.rpmont.conferencia.model.Usuario;
import br.com.rpmont.conferencia.repository.NotificacaoFenoRacaoRepository;
import br.com.rpmont.conferencia.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificacaoFenoRacaoServiceImpl
        implements NotificacaoFenoRacaoService {

    private static final int NIVEL_ADMIN_MASTER = 1;
    private static final int NIVEL_ADMIN = 2;

    private final NotificacaoFenoRacaoRepository
            notificacaoRepository;

    private final UsuarioRepository
            usuarioRepository;

    /*
     * ==========================================
     * LISTAR TODAS
     * ==========================================
     */

    @Override
    @Transactional(readOnly = true)
    public List<NotificacaoFenoRacaoResponseDTO> listar(
            String matriculaUsuario
    ) {
        Usuario usuario =
                buscarUsuarioAutenticado(
                        matriculaUsuario
                );

        validarUsuarioParaOperacao(
                usuario
        );

        List<NotificacaoFenoRacao> notificacoes;

        /*
         * ADMIN_MASTER:
         *
         * Possui visão global de todas as
         * notificações.
         */
        if (usuarioEhAdminMaster(
                usuario
        )) {
            notificacoes =
                    notificacaoRepository.findAll();

            ordenarPorDataCriacaoDesc(
                    notificacoes
            );

            return converterListaParaResponse(
                    notificacoes
            );
        }

        String unidadeUsuario =
                normalizarUnidade(
                        usuario.getUnidade()
                );

        /*
         * Notificações gerais da unidade.
         *
         * Exemplo:
         * - transferências;
         * - respostas de transferências.
         *
         * Essas notificações possuem:
         *
         * usuarioDestinoID = NULL
         */
        List<NotificacaoFenoRacao>
                notificacoesGerais =
                notificacaoRepository
                        .findByUnidadeDestinoAndUsuarioDestinoIdIsNullOrderByDataCriacaoDesc(
                                unidadeUsuario
                        );

        /*
         * Nível 3:
         *
         * Continua recebendo somente as
         * notificações gerais da unidade.
         *
         * Não recebe notificações administrativas
         * individuais de extravio.
         */
        if (!usuarioEhAdministrador(
                usuario
        )) {
            return converterListaParaResponse(
                    notificacoesGerais
            );
        }

        /*
         * ADMIN:
         *
         * Recebe:
         *
         * 1. notificações gerais da unidade;
         * 2. notificações individuais destinadas
         *    especificamente ao seu usuário.
         */
        List<NotificacaoFenoRacao>
                notificacoesIndividuais =
                notificacaoRepository
                        .findByUsuarioDestinoIdOrderByDataCriacaoDesc(
                                usuario.getId()
                        );

        notificacoes =
                combinarNotificacoes(
                        notificacoesGerais,
                        notificacoesIndividuais
                );

        return converterListaParaResponse(
                notificacoes
        );
    }

    /*
     * ==========================================
     * LISTAR NÃO LIDAS
     * ==========================================
     */

    @Override
    @Transactional(readOnly = true)
    public List<NotificacaoFenoRacaoResponseDTO> listarNaoLidas(
            String matriculaUsuario
    ) {
        Usuario usuario =
                buscarUsuarioAutenticado(
                        matriculaUsuario
                );

        validarUsuarioParaOperacao(
                usuario
        );

        /*
         * ADMIN_MASTER:
         *
         * Visualiza globalmente todas as
         * notificações não lidas.
         */
        if (usuarioEhAdminMaster(
                usuario
        )) {
            return notificacaoRepository
                    .findByLidaOrderByDataCriacaoDesc(
                            false
                    )
                    .stream()
                    .map(
                            this::converterParaResponse
                    )
                    .toList();
        }

        String unidadeUsuario =
                normalizarUnidade(
                        usuario.getUnidade()
                );

        /*
         * Notificações gerais não lidas
         * da unidade.
         */
        List<NotificacaoFenoRacao>
                notificacoesGerais =
                notificacaoRepository
                        .findByUnidadeDestinoAndUsuarioDestinoIdIsNullAndLidaOrderByDataCriacaoDesc(
                                unidadeUsuario,
                                false
                        );

        /*
         * Nível 3:
         *
         * Não recebe notificações individuais
         * administrativas de extravio.
         */
        if (!usuarioEhAdministrador(
                usuario
        )) {
            return converterListaParaResponse(
                    notificacoesGerais
            );
        }

        /*
         * Notificações individuais não lidas
         * destinadas ao ADMIN logado.
         */
        List<NotificacaoFenoRacao>
                notificacoesIndividuais =
                notificacaoRepository
                        .findByUsuarioDestinoIdAndLidaOrderByDataCriacaoDesc(
                                usuario.getId(),
                                false
                        );

        List<NotificacaoFenoRacao> notificacoes =
                combinarNotificacoes(
                        notificacoesGerais,
                        notificacoesIndividuais
                );

        return converterListaParaResponse(
                notificacoes
        );
    }

    /*
     * ==========================================
     * CONTAR NÃO LIDAS
     * ==========================================
     */

    @Override
    @Transactional(readOnly = true)
    public long contarNaoLidas(
            String matriculaUsuario
    ) {
        Usuario usuario =
                buscarUsuarioAutenticado(
                        matriculaUsuario
                );

        validarUsuarioParaOperacao(
                usuario
        );

        /*
         * ADMIN_MASTER:
         *
         * Contagem global.
         */
        if (usuarioEhAdminMaster(
                usuario
        )) {
            return notificacaoRepository
                    .countByLida(
                            false
                    );
        }

        String unidadeUsuario =
                normalizarUnidade(
                        usuario.getUnidade()
                );

        long quantidadeGerais =
                notificacaoRepository
                        .countByUnidadeDestinoAndUsuarioDestinoIdIsNullAndLida(
                                unidadeUsuario,
                                false
                        );

        /*
         * Nível 3:
         *
         * Conta somente as notificações
         * gerais da unidade.
         */
        if (!usuarioEhAdministrador(
                usuario
        )) {
            return quantidadeGerais;
        }

        /*
         * ADMIN:
         *
         * Soma notificações gerais +
         * notificações individuais.
         */
        long quantidadeIndividuais =
                notificacaoRepository
                        .countByUsuarioDestinoIdAndLida(
                                usuario.getId(),
                                false
                        );

        return quantidadeGerais
                + quantidadeIndividuais;
    }

    /*
     * ==========================================
     * CONCLUIR NOTIFICAÇÕES DE EXTRAVIO
     * ==========================================
     */

    @Override
    @Transactional
    public void concluirNotificacoesExtravio(
            Long movimentacaoId,
            Long usuarioAnaliseId
    ) {
        if (
                movimentacaoId == null ||
                        movimentacaoId <= 0
        ) {
            throw new BusinessException(
                    "O ID da movimentação é obrigatório."
            );
        }

        if (
                usuarioAnaliseId == null ||
                        usuarioAnaliseId <= 0
        ) {
            throw new BusinessException(
                    "O usuário responsável pela análise é obrigatório."
            );
        }

        List<NotificacaoFenoRacao> notificacoes =
                notificacaoRepository
                        .findByMovimentacaoIdAndLida(
                                movimentacaoId,
                                false
                        );

        if (
                notificacoes == null ||
                        notificacoes.isEmpty()
        ) {
            return;
        }

        LocalDateTime dataLeitura =
                LocalDateTime.now();

        for (NotificacaoFenoRacao notificacao : notificacoes) {

            notificacao.setLida(
                    true
            );

            notificacao.setDataLeitura(
                    dataLeitura
            );

            notificacao.setUsuarioLeituraId(
                    usuarioAnaliseId
            );
        }

        notificacaoRepository.saveAll(
                notificacoes
        );
    }

    /*
     * ==========================================
     * MARCAR COMO LIDA
     * ==========================================
     */

    @Override
    @Transactional
    public MarcarNotificacaoLidaResponseDTO marcarComoLida(
            Long notificacaoId,
            String matriculaUsuario
    ) {
        validarIdNotificacao(
                notificacaoId
        );

        Usuario usuario =
                buscarUsuarioAutenticado(
                        matriculaUsuario
                );

        validarUsuarioParaOperacao(
                usuario
        );

        NotificacaoFenoRacao notificacao =
                notificacaoRepository
                        .findById(
                                notificacaoId
                        )
                        .orElseThrow(
                                () ->
                                        new ResourceNotFoundException(
                                                "Notificação de feno ou ração não encontrada."
                                        )
                        );

        validarAcessoNotificacao(
                usuario,
                notificacao
        );

        if (Boolean.TRUE.equals(
                notificacao.getLida()
        )) {
            return new MarcarNotificacaoLidaResponseDTO(
                    notificacao.getId(),
                    true,
                    notificacao.getDataLeitura(),
                    notificacao.getUsuarioLeituraId(),
                    "A notificação já estava marcada como lida."
            );
        }

        LocalDateTime dataLeitura =
                LocalDateTime.now();

        notificacao.setLida(
                true
        );

        notificacao.setDataLeitura(
                dataLeitura
        );

        notificacao.setUsuarioLeituraId(
                usuario.getId()
        );

        NotificacaoFenoRacao salva =
                notificacaoRepository.save(
                        notificacao
                );

        return new MarcarNotificacaoLidaResponseDTO(
                salva.getId(),
                salva.getLida(),
                salva.getDataLeitura(),
                salva.getUsuarioLeituraId(),
                "Notificação marcada como lida com sucesso."
        );
    }

    /*
     * ==========================================
     * USUÁRIO
     * ==========================================
     */

    private Usuario buscarUsuarioAutenticado(
            String matriculaUsuario
    ) {
        if (
                matriculaUsuario == null ||
                        matriculaUsuario.isBlank()
        ) {
            throw new ForbiddenException(
                    "Não foi possível identificar o usuário autenticado."
            );
        }

        return usuarioRepository
                .findByMatricula(
                        matriculaUsuario.trim()
                )
                .orElseThrow(
                        () ->
                                new ResourceNotFoundException(
                                        "Usuário autenticado não encontrado."
                                )
                );
    }

    private void validarUsuarioParaOperacao(
            Usuario usuario
    ) {
        if (
                !Boolean.TRUE.equals(
                        usuario.getAtivo()
                )
        ) {
            throw new ForbiddenException(
                    "O usuário está inativo."
            );
        }

        if (
                usuario.getStatusAcesso() == null ||
                        !"LIBERADO".equalsIgnoreCase(
                                usuario
                                        .getStatusAcesso()
                                        .trim()
                        )
        ) {
            throw new ForbiddenException(
                    "O usuário não possui acesso liberado."
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
     * PERMISSÕES
     * ==========================================
     */

    private boolean usuarioEhAdminMaster(
            Usuario usuario
    ) {
        return Integer
                .valueOf(
                        NIVEL_ADMIN_MASTER
                )
                .equals(
                        usuario.getNivel()
                );
    }

    private boolean usuarioEhAdministrador(
            Usuario usuario
    ) {
        return Integer
                .valueOf(
                        NIVEL_ADMIN
                )
                .equals(
                        usuario.getNivel()
                );
    }

    /*
     * ==========================================
     * ACESSO À NOTIFICAÇÃO
     * ==========================================
     */

    private void validarAcessoNotificacao(
            Usuario usuario,
            NotificacaoFenoRacao notificacao
    ) {
        /*
         * ADMIN_MASTER:
         *
         * Acesso global.
         */
        if (usuarioEhAdminMaster(
                usuario
        )) {
            return;
        }

        Long usuarioDestinoId =
                notificacao.getUsuarioDestinoId();

        /*
         * NOTIFICAÇÃO INDIVIDUAL
         *
         * Quando existe usuarioDestinoID,
         * somente aquele usuário pode acessar
         * e marcar a notificação como lida.
         */
        if (usuarioDestinoId != null) {

            if (
                    !usuarioDestinoId.equals(
                            usuario.getId()
                    )
            ) {
                throw new ForbiddenException(
                        "Esta notificação pertence a outro usuário."
                );
            }

            return;
        }



        /*
         * NOTIFICAÇÃO GERAL
         *
         * Quando usuarioDestinoID é NULL,
         * permanece a regra tradicional
         * por unidade.
         */
        String unidadeUsuario =
                normalizarUnidade(
                        usuario.getUnidade()
                );

        if (
                notificacao.getUnidadeDestino() == null ||
                        !unidadeUsuario.equalsIgnoreCase(
                                notificacao
                                        .getUnidadeDestino()
                                        .trim()
                        )
        ) {
            throw new ForbiddenException(
                    "O usuário não possui acesso a esta notificação."
            );
        }
    }

    /*
     * ==========================================
     * VALIDAÇÕES
     * ==========================================
     */

    private void validarIdNotificacao(
            Long notificacaoId
    ) {
        if (
                notificacaoId == null ||
                        notificacaoId <= 0
        ) {
            throw new BusinessException(
                    "O ID da notificação deve ser maior que zero."
            );
        }
    }

    /*
     * ==========================================
     * UNIDADE
     * ==========================================
     */

    private String normalizarUnidade(
            String unidade
    ) {
        if (
                unidade == null ||
                        unidade.isBlank()
        ) {
            throw new BusinessException(
                    "A unidade é obrigatória."
            );
        }

        return unidade.trim();
    }

    /*
     * ==========================================
     * LISTAS
     * ==========================================
     */

    private List<NotificacaoFenoRacao> combinarNotificacoes(
            List<NotificacaoFenoRacao> gerais,
            List<NotificacaoFenoRacao> individuais
    ) {
        List<NotificacaoFenoRacao> resultado =
                new ArrayList<>();

        if (gerais != null) {
            resultado.addAll(
                    gerais
            );
        }

        if (individuais != null) {
            resultado.addAll(
                    individuais
            );
        }

        ordenarPorDataCriacaoDesc(
                resultado
        );

        return resultado;
    }

    private void ordenarPorDataCriacaoDesc(
            List<NotificacaoFenoRacao> notificacoes
    ) {
        notificacoes.sort(
                Comparator.comparing(
                                NotificacaoFenoRacao::getDataCriacao,
                                Comparator.nullsLast(
                                        Comparator.naturalOrder()
                                )
                        )
                        .reversed()
        );
    }

    /*
     * ==========================================
     * RESPONSE
     * ==========================================
     */

    private List<NotificacaoFenoRacaoResponseDTO>
    converterListaParaResponse(
            List<NotificacaoFenoRacao> notificacoes
    ) {
        return notificacoes
                .stream()
                .map(
                        this::converterParaResponse
                )
                .toList();
    }

    private NotificacaoFenoRacaoResponseDTO converterParaResponse(
            NotificacaoFenoRacao notificacao
    ) {
        Long solicitacaoId =
                notificacao.getSolicitacao() != null
                        ? notificacao
                        .getSolicitacao()
                        .getId()
                        : null;

        return new NotificacaoFenoRacaoResponseDTO(
                notificacao.getId(),
                notificacao.getUnidadeDestino(),
                notificacao.getTitulo(),
                notificacao.getMensagem(),
                notificacao.getTipo(),
                solicitacaoId,
                notificacao.getUsuarioDestinoId(),
                notificacao.getMovimentacaoId(),
                notificacao.getLida(),
                notificacao.getDataCriacao(),
                notificacao.getDataLeitura(),
                notificacao.getUsuarioLeituraId()
        );
    }
}