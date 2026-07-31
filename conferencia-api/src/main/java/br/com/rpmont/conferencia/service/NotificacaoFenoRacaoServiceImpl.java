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
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificacaoFenoRacaoServiceImpl
        implements NotificacaoFenoRacaoService {

    private final NotificacaoFenoRacaoRepository
            notificacaoRepository;

    private final UsuarioRepository
            usuarioRepository;

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

        if (usuarioEhAdminMaster(
                usuario
        )) {
            notificacoes =
                    notificacaoRepository
                            .findAll()
                            .stream()
                            .sorted((primeira, segunda) -> {
                                LocalDateTime dataPrimeira =
                                        primeira.getDataCriacao();

                                LocalDateTime dataSegunda =
                                        segunda.getDataCriacao();

                                if (dataPrimeira == null
                                        && dataSegunda == null) {
                                    return 0;
                                }

                                if (dataPrimeira == null) {
                                    return 1;
                                }

                                if (dataSegunda == null) {
                                    return -1;
                                }

                                return dataSegunda.compareTo(
                                        dataPrimeira
                                );
                            })
                            .toList();
        } else {
            String unidadeUsuario =
                    normalizarUnidade(
                            usuario.getUnidade()
                    );

            notificacoes =
                    notificacaoRepository
                            .findByUnidadeDestinoOrderByDataCriacaoDesc(
                                    unidadeUsuario
                            );
        }

        return notificacoes
                .stream()
                .map(
                        this::converterParaResponse
                )
                .toList();
    }

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

        List<NotificacaoFenoRacao> notificacoes;

        if (usuarioEhAdminMaster(
                usuario
        )) {
            notificacoes =
                    notificacaoRepository
                            .findByLidaOrderByDataCriacaoDesc(
                                    false
                            );
        } else {
            String unidadeUsuario =
                    normalizarUnidade(
                            usuario.getUnidade()
                    );

            notificacoes =
                    notificacaoRepository
                            .findByUnidadeDestinoAndLidaOrderByDataCriacaoDesc(
                                    unidadeUsuario,
                                    false
                            );
        }

        return notificacoes
                .stream()
                .map(
                        this::converterParaResponse
                )
                .toList();
    }

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

        return notificacaoRepository
                .countByUnidadeDestinoAndLida(
                        unidadeUsuario,
                        false
                );
    }

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
                        .orElseThrow(() ->
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

    private Usuario buscarUsuarioAutenticado(
            String matriculaUsuario
    ) {
        if (matriculaUsuario == null
                || matriculaUsuario.isBlank()) {

            throw new ForbiddenException(
                    "Não foi possível identificar o usuário autenticado."
            );
        }

        return usuarioRepository
                .findByMatricula(
                        matriculaUsuario.trim()
                )
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Usuário autenticado não encontrado."
                        )
                );
    }

    private void validarUsuarioParaOperacao(
            Usuario usuario
    ) {
        if (!Boolean.TRUE.equals(
                usuario.getAtivo()
        )) {
            throw new ForbiddenException(
                    "O usuário está inativo."
            );
        }

        if (!"LIBERADO".equalsIgnoreCase(
                usuario.getStatusAcesso()
        )) {
            throw new ForbiddenException(
                    "O usuário não possui acesso liberado."
            );
        }

        if (usuario.getUnidade() == null
                || usuario.getUnidade().isBlank()) {

            throw new ForbiddenException(
                    "O usuário não possui unidade cadastrada."
            );
        }
    }

    private void validarAcessoNotificacao(
            Usuario usuario,
            NotificacaoFenoRacao notificacao
    ) {
        if (usuarioEhAdminMaster(
                usuario
        )) {
            return;
        }

        String unidadeUsuario =
                normalizarUnidade(
                        usuario.getUnidade()
                );

        if (notificacao.getUnidadeDestino() == null
                || !unidadeUsuario.equalsIgnoreCase(
                notificacao.getUnidadeDestino()
        )) {
            throw new ForbiddenException(
                    "O usuário não possui acesso a esta notificação."
            );
        }
    }

    private boolean usuarioEhAdminMaster(
            Usuario usuario
    ) {
        return Integer
                .valueOf(1)
                .equals(
                        usuario.getNivel()
                );
    }

    private void validarIdNotificacao(
            Long notificacaoId
    ) {
        if (notificacaoId == null
                || notificacaoId <= 0) {

            throw new BusinessException(
                    "O ID da notificação deve ser maior que zero."
            );
        }
    }

    private String normalizarUnidade(
            String unidade
    ) {
        if (unidade == null
                || unidade.isBlank()) {

            throw new BusinessException(
                    "A unidade é obrigatória."
            );
        }

        return unidade.trim();
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
                notificacao.getLida(),
                notificacao.getDataCriacao(),
                notificacao.getDataLeitura(),
                notificacao.getUsuarioLeituraId()
        );
    }
}