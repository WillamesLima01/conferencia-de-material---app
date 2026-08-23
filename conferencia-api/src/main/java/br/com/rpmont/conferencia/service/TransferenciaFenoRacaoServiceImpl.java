package br.com.rpmont.conferencia.service;

import br.com.rpmont.conferencia.dtos.ItemTransferenciaFenoRacaoResponseDTO;
import br.com.rpmont.conferencia.dtos.TransferenciaFenoRacaoResponseDTO;
import br.com.rpmont.conferencia.enums.SituacaoTransferenciaFenoRacao;
import br.com.rpmont.conferencia.exception.BusinessException;
import br.com.rpmont.conferencia.exception.ForbiddenException;
import br.com.rpmont.conferencia.exception.ResourceNotFoundException;
import br.com.rpmont.conferencia.model.ItemSolicitacaoTransferenciaFenoRacao;
import br.com.rpmont.conferencia.model.LoteFenoRacao;
import br.com.rpmont.conferencia.model.TransferenciaFenoRacao;
import br.com.rpmont.conferencia.model.Usuario;
import br.com.rpmont.conferencia.repository.ItemSolicitacaoTransferenciaFenoRacaoRepository;
import br.com.rpmont.conferencia.repository.TransferenciaFenoRacaoRepository;
import br.com.rpmont.conferencia.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TransferenciaFenoRacaoServiceImpl
        implements TransferenciaFenoRacaoService {

    private final TransferenciaFenoRacaoRepository
            transferenciaRepository;

    private final UsuarioRepository
            usuarioRepository;

    private final ItemSolicitacaoTransferenciaFenoRacaoRepository
            itemSolicitacaoRepository;

    @Override
    @Transactional(readOnly = true)
    public List<TransferenciaFenoRacaoResponseDTO> listarEnviadas(
            Integer produtoId,
            LocalDate dataInicial,
            LocalDate dataFinal,
            SituacaoTransferenciaFenoRacao situacao,
            String matriculaUsuario
    ) {
        validarFiltros(
                produtoId,
                dataInicial,
                dataFinal
        );

        Usuario usuario =
                buscarUsuarioAutenticado(
                        matriculaUsuario
                );

        validarUsuarioParaOperacao(
                usuario
        );

        validarUsuarioAdministrador(
                usuario
        );

        List<TransferenciaFenoRacao> transferencias;

        if (usuarioEhAdminMaster(
                usuario
        )) {
            transferencias =
                    transferenciaRepository.findAll();
        } else {
            String unidadeUsuario =
                    normalizarUnidade(
                            usuario.getUnidade()
                    );

            transferencias =
                    transferenciaRepository
                            .findByUnidadeOrigemOrderByDataTransferenciaDesc(
                                    unidadeUsuario
                            );
        }

        return filtrarEConverter(
                transferencias,
                produtoId,
                dataInicial,
                dataFinal,
                situacao
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<TransferenciaFenoRacaoResponseDTO> listarRecebidas(
            Integer produtoId,
            LocalDate dataInicial,
            LocalDate dataFinal,
            SituacaoTransferenciaFenoRacao situacao,
            String matriculaUsuario
    ) {
        validarFiltros(
                produtoId,
                dataInicial,
                dataFinal
        );

        Usuario usuario =
                buscarUsuarioAutenticado(
                        matriculaUsuario
                );

        validarUsuarioParaOperacao(
                usuario
        );

        validarUsuarioAdministrador(
                usuario
        );

        List<TransferenciaFenoRacao> transferencias;

        if (usuarioEhAdminMaster(
                usuario
        )) {
            transferencias =
                    transferenciaRepository.findAll();
        } else {
            String unidadeUsuario =
                    normalizarUnidade(
                            usuario.getUnidade()
                    );

            transferencias =
                    transferenciaRepository
                            .findByUnidadeDestinoOrderByDataTransferenciaDesc(
                                    unidadeUsuario
                            );
        }

        return filtrarEConverter(
                transferencias,
                produtoId,
                dataInicial,
                dataFinal,
                situacao
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<TransferenciaFenoRacaoResponseDTO> listarTodas(
            Integer produtoId,
            LocalDate dataInicial,
            LocalDate dataFinal,
            SituacaoTransferenciaFenoRacao situacao,
            String matriculaUsuario
    ) {
        validarFiltros(
                produtoId,
                dataInicial,
                dataFinal
        );

        Usuario usuario =
                buscarUsuarioAutenticado(
                        matriculaUsuario
                );

        validarUsuarioParaOperacao(
                usuario
        );

        validarUsuarioAdministrador(
                usuario
        );

        List<TransferenciaFenoRacao> transferencias;

        if (usuarioEhAdminMaster(
                usuario
        )) {
            transferencias =
                    transferenciaRepository.findAll();
        } else {
            String unidadeUsuario =
                    normalizarUnidade(
                            usuario.getUnidade()
                    );

            transferencias =
                    transferenciaRepository
                            .findByUnidadeOrigemOrUnidadeDestinoOrderByDataTransferenciaDesc(
                                    unidadeUsuario,
                                    unidadeUsuario
                            );
        }

        return filtrarEConverter(
                transferencias,
                produtoId,
                dataInicial,
                dataFinal,
                situacao
        );
    }

    @Override
    @Transactional(readOnly = true)
    public TransferenciaFenoRacaoResponseDTO buscarPorId(
            Long transferenciaId,
            String matriculaUsuario
    ) {
        validarIdTransferencia(
                transferenciaId
        );

        Usuario usuario =
                buscarUsuarioAutenticado(
                        matriculaUsuario
                );

        validarUsuarioParaOperacao(
                usuario
        );

        validarUsuarioAdministrador(
                usuario
        );

        TransferenciaFenoRacao transferencia =
                transferenciaRepository
                        .findById(
                                transferenciaId
                        )
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Transferência de feno ou ração não encontrada."
                                )
                        );

        validarAcessoTransferencia(
                usuario,
                transferencia
        );

        return converterParaResponse(
                transferencia
        );
    }

    private List<TransferenciaFenoRacaoResponseDTO> filtrarEConverter(
            List<TransferenciaFenoRacao> transferencias,
            Integer produtoId,
            LocalDate dataInicial,
            LocalDate dataFinal,
            SituacaoTransferenciaFenoRacao situacao
    ) {
        LocalDateTime inicio =
                dataInicial != null
                        ? dataInicial.atStartOfDay()
                        : null;

        LocalDateTime fim =
                dataFinal != null
                        ? dataFinal.atTime(
                        LocalTime.MAX
                )
                        : null;

        return transferencias
                .stream()
                .filter(transferencia ->
                        produtoId == null
                                || (
                                transferencia.getProduto() != null
                                        && produtoId.equals(
                                        transferencia
                                                .getProduto()
                                                .getId()
                                )
                        )
                )
                .filter(transferencia ->
                        situacao == null
                                || situacao
                                == transferencia.getSituacao()
                )
                .filter(transferencia ->
                        inicio == null
                                || (
                                transferencia.getDataTransferencia() != null
                                        && !transferencia
                                        .getDataTransferencia()
                                        .isBefore(
                                                inicio
                                        )
                        )
                )
                .filter(transferencia ->
                        fim == null
                                || (
                                transferencia.getDataTransferencia() != null
                                        && !transferencia
                                        .getDataTransferencia()
                                        .isAfter(
                                                fim
                                        )
                        )
                )
                .sorted(
                        Comparator.comparing(
                                TransferenciaFenoRacao
                                        ::getDataTransferencia,
                                Comparator.nullsLast(
                                        Comparator.reverseOrder()
                                )
                        )
                )
                .map(
                        this::converterParaResponse
                )
                .toList();
    }

    private TransferenciaFenoRacaoResponseDTO converterParaResponse(
            TransferenciaFenoRacao transferencia
    ) {
        String aprovadoPorNome =
                buscarNomeUsuario(
                        transferencia.getAprovadoPorId()
                );

        List<ItemTransferenciaFenoRacaoResponseDTO> etapas =
                converterEtapasParaResponse(
                        transferencia.getId()
                );

        return new TransferenciaFenoRacaoResponseDTO(
                transferencia.getId(),

                transferencia.getSolicitacao() != null
                        ? transferencia
                        .getSolicitacao()
                        .getId()
                        : null,

                transferencia.getProduto() != null
                        ? transferencia
                        .getProduto()
                        .getId()
                        : null,

                transferencia.getProduto() != null
                        ? transferencia
                        .getProduto()
                        .getTipoProduto()
                        : null,

                transferencia.getProduto() != null
                        ? transferencia
                        .getProduto()
                        .getNomeProduto()
                        : null,

                transferencia.getProduto() != null
                        ? transferencia
                        .getProduto()
                        .getUnidadeControle()
                        : null,

                transferencia.getLoteOrigem() != null
                        ? transferencia
                        .getLoteOrigem()
                        .getId()
                        : null,

                transferencia.getLoteOrigem() != null
                        ? transferencia
                        .getLoteOrigem()
                        .getCodigoLote()
                        : null,

                transferencia.getLoteDestino() != null
                        ? transferencia
                        .getLoteDestino()
                        .getId()
                        : null,

                transferencia.getLoteDestino() != null
                        ? transferencia
                        .getLoteDestino()
                        .getCodigoLote()
                        : null,

                transferencia.getUnidadeOrigem(),
                transferencia.getUnidadeDestino(),
                transferencia.getQuantidadeTransferida(),
                transferencia.getPesoUnidadeKg(),
                transferencia.getPesoTotalKg(),
                transferencia.getSaldoAnteriorOrigem(),
                transferencia.getSaldoPosteriorOrigem(),
                transferencia.getAprovadoPorId(),
                aprovadoPorNome,
                transferencia.getDataTransferencia(),
                transferencia.getObservacao(),
                transferencia.getSituacao(),
                etapas
        );
    }

    private List<ItemTransferenciaFenoRacaoResponseDTO>
    converterEtapasParaResponse(
            Long transferenciaId
    ) {
        return itemSolicitacaoRepository
                .findByTransferenciaIdOrderByOrdemAtendimentoAsc(
                        transferenciaId
                )
                .stream()
                .map(this::converterEtapaParaResponse)
                .toList();
    }

    private ItemTransferenciaFenoRacaoResponseDTO
    converterEtapaParaResponse(
            ItemSolicitacaoTransferenciaFenoRacao item
    ) {
        LoteFenoRacao loteOrigem =
                item.getLoteOrigem();

        LoteFenoRacao loteDestino =
                item.getLoteDestino();

        return new ItemTransferenciaFenoRacaoResponseDTO(
                item.getId(),
                item.getOrdemAtendimento(),
                loteOrigem != null
                        ? loteOrigem.getId()
                        : null,
                loteOrigem != null
                        ? loteOrigem.getCodigoLote()
                        : null,
                loteOrigem != null
                        ? loteOrigem.getDataEntrada()
                        : null,
                loteOrigem != null
                        ? loteOrigem.getValidade()
                        : null,
                loteDestino != null
                        ? loteDestino.getId()
                        : null,
                loteDestino != null
                        ? loteDestino.getCodigoLote()
                        : null,
                item.getQuantidadePrevista(),
                item.getQuantidadeAprovada(),
                item.getSaldoAnterior(),
                item.getSaldoPosterior()
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

    private void validarUsuarioAdministrador(
            Usuario usuario
    ) {
        if (usuario.getNivel() == null
                || (
                usuario.getNivel() != 1
                        && usuario.getNivel() != 2
        )) {
            throw new ForbiddenException(
                    "Somente administradores podem consultar transferências de Feno e Ração."
            );
        }
    }

    private void validarAcessoTransferencia(
            Usuario usuario,
            TransferenciaFenoRacao transferencia
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

        boolean unidadeEnvolvida =
                unidadeUsuario.equalsIgnoreCase(
                        transferencia.getUnidadeOrigem()
                )
                        || unidadeUsuario.equalsIgnoreCase(
                        transferencia.getUnidadeDestino()
                );

        if (!unidadeEnvolvida) {
            throw new ForbiddenException(
                    "O usuário não possui acesso a esta transferência."
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

    private void validarFiltros(
            Integer produtoId,
            LocalDate dataInicial,
            LocalDate dataFinal
    ) {
        if (produtoId != null
                && produtoId <= 0) {

            throw new BusinessException(
                    "O ID do produto deve ser maior que zero."
            );
        }

        if (dataInicial != null
                && dataFinal != null
                && dataInicial.isAfter(
                dataFinal
        )) {
            throw new BusinessException(
                    "A data inicial não pode ser posterior à data final."
            );
        }
    }

    private void validarIdTransferencia(
            Long transferenciaId
    ) {
        if (transferenciaId == null
                || transferenciaId <= 0) {

            throw new BusinessException(
                    "O ID da transferência deve ser maior que zero."
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

    private String buscarNomeUsuario(
            Long usuarioId
    ) {
        if (usuarioId == null) {
            return null;
        }

        return usuarioRepository
                .findById(
                        usuarioId
                )
                .map(
                        Usuario::getNome
                )
                .orElse(
                        null
                );
    }
}