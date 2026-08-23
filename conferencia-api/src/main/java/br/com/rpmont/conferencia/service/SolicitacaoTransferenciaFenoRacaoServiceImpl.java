package br.com.rpmont.conferencia.service;

import br.com.rpmont.conferencia.dtos.AprovarSolicitacaoTransferenciaFenoRacaoRequestDTO;
import br.com.rpmont.conferencia.dtos.ItemSolicitacaoTransferenciaFenoRacaoResponseDTO;
import br.com.rpmont.conferencia.dtos.SolicitacaoTransferenciaFenoRacaoRequestDTO;
import br.com.rpmont.conferencia.dtos.SolicitacaoTransferenciaFenoRacaoResponseDTO;
import br.com.rpmont.conferencia.enums.SituacaoLoteFenoRacao;
import br.com.rpmont.conferencia.enums.SituacaoMovimentacaoFenoRacao;
import br.com.rpmont.conferencia.enums.SituacaoProdutoFenoRacao;
import br.com.rpmont.conferencia.enums.SituacaoTransferenciaFenoRacao;
import br.com.rpmont.conferencia.enums.StatusSolicitacaoTransferenciaFenoRacao;
import br.com.rpmont.conferencia.enums.TipoMovimentacaoFenoRacao;
import br.com.rpmont.conferencia.enums.TipoNotificacaoFenoRacao;
import br.com.rpmont.conferencia.exception.BusinessException;
import br.com.rpmont.conferencia.exception.ConflictException;
import br.com.rpmont.conferencia.exception.ForbiddenException;
import br.com.rpmont.conferencia.exception.ResourceNotFoundException;
import br.com.rpmont.conferencia.model.*;
import br.com.rpmont.conferencia.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class SolicitacaoTransferenciaFenoRacaoServiceImpl
        implements SolicitacaoTransferenciaFenoRacaoService {

    private final SolicitacaoTransferenciaFenoRacaoRepository
            solicitacaoRepository;

    private final ProdutoFenoRacaoRepository
            produtoRepository;

    private final LoteFenoRacaoRepository
            loteRepository;

    private final NotificacaoFenoRacaoRepository
            notificacaoRepository;

    private final UsuarioRepository
            usuarioRepository;

    private final TransferenciaFenoRacaoRepository
            transferenciaRepository;

    private final MovimentacaoFenoRacaoRepository
            movimentacaoRepository;

    private final ItemSolicitacaoTransferenciaFenoRacaoRepository
            itemSolicitacaoRepository;

    @Override
    @Transactional
    public SolicitacaoTransferenciaFenoRacaoResponseDTO solicitar(
            SolicitacaoTransferenciaFenoRacaoRequestDTO request,
            String matriculaUsuario
    ) {
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

        String unidadeSolicitante =
                normalizarUnidade(
                        usuario.getUnidade()
                );

        String unidadeOrigem =
                normalizarUnidade(
                        request.unidadeOrigem()
                );

        if (unidadeSolicitante.equalsIgnoreCase(
                unidadeOrigem
        )) {
            throw new BusinessException(
                    "A unidade de origem deve ser diferente da unidade solicitante."
            );
        }

        ProdutoFenoRacao produto =
                produtoRepository
                        .findById(
                                request.produtoId()
                        )
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Produto de feno ou ração não encontrado."
                                )
                        );

        if (produto.getSituacao()
                != SituacaoProdutoFenoRacao.ATIVO) {

            throw new ConflictException(
                    "O produto selecionado está inativo."
            );
        }

        List<LoteFenoRacao> lotesDisponiveis =
                buscarLotesValidos(
                        produto.getId(),
                        unidadeOrigem
                );

        int quantidadeDisponivel =
                lotesDisponiveis
                        .stream()
                        .map(
                                LoteFenoRacao::getQuantidadeAtual
                        )
                        .filter(
                                Objects::nonNull
                        )
                        .mapToInt(
                                Integer::intValue
                        )
                        .sum();

        if (quantidadeDisponivel <= 0) {
            throw new ConflictException(
                    "A unidade de origem não possui estoque disponível para o produto selecionado."
            );
        }

        if (quantidadeDisponivel
                < request.quantidadeSolicitada()) {

            throw new ConflictException(
                    "A unidade de origem não possui estoque suficiente para atender à solicitação."
            );
        }

        BigDecimal pesoTotalSolicitado =
                produto
                        .getPesoUnidadeKg()
                        .multiply(
                                BigDecimal.valueOf(
                                        request.quantidadeSolicitada()
                                )
                        );

        int saldoPrevistoOrigem =
                quantidadeDisponivel
                        - request.quantidadeSolicitada();

        LocalDateTime dataAtual =
                LocalDateTime.now();

        SolicitacaoTransferenciaFenoRacao solicitacao =
                SolicitacaoTransferenciaFenoRacao
                        .builder()
                        .produto(
                                produto
                        )
                        .loteSelecionado(
                                null
                        )
                        .unidadeSolicitante(
                                unidadeSolicitante
                        )
                        .unidadeOrigem(
                                unidadeOrigem
                        )
                        .quantidadeSolicitada(
                                request.quantidadeSolicitada()
                        )
                        .quantidadeAprovada(
                                null
                        )
                        .pesoUnidadeKg(
                                produto.getPesoUnidadeKg()
                        )
                        .pesoTotalSolicitadoKg(
                                pesoTotalSolicitado
                        )
                        .pesoTotalAprovadoKg(
                                null
                        )
                        .quantidadeDisponivelNoPedido(
                                quantidadeDisponivel
                        )
                        .saldoPrevistoOrigem(
                                saldoPrevistoOrigem
                        )
                        .justificativa(
                                request.justificativa().trim()
                        )
                        .status(
                                StatusSolicitacaoTransferenciaFenoRacao
                                        .PENDENTE
                        )
                        .solicitadoPorId(
                                usuario.getId()
                        )
                        .dataSolicitacao(
                                dataAtual
                        )
                        .respondidoPorId(
                                null
                        )
                        .dataResposta(
                                null
                        )
                        .observacaoResposta(
                                null
                        )
                        .build();

        SolicitacaoTransferenciaFenoRacao salva =
                solicitacaoRepository.save(
                        solicitacao
                );

        criarItensPlanejados(
                salva,
                lotesDisponiveis,
                request.quantidadeSolicitada(),
                usuario,
                dataAtual
        );

        criarNotificacaoNovaSolicitacao(
                salva,
                dataAtual
        );
        return converterParaResponse(
                salva
        );
    }

    @Override
    @Transactional(readOnly = true)
    public SolicitacaoTransferenciaFenoRacaoResponseDTO buscarPorId(
            Long solicitacaoId,
            String matriculaUsuario
    ) {
        validarIdSolicitacao(
                solicitacaoId
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

        SolicitacaoTransferenciaFenoRacao solicitacao =
                buscarSolicitacao(
                        solicitacaoId
                );

        validarAcessoConsulta(
                usuario,
                solicitacao
        );

        return converterParaResponse(
                solicitacao
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<SolicitacaoTransferenciaFenoRacaoResponseDTO>
    listarRecebidas(
            StatusSolicitacaoTransferenciaFenoRacao status,
            String matriculaUsuario
    ) {
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

        List<SolicitacaoTransferenciaFenoRacao>
                solicitacoes;

        if (usuarioEhAdminMaster(
                usuario
        )) {
            if (status == null) {
                solicitacoes =
                        solicitacaoRepository
                                .findAll();
            } else {
                solicitacoes =
                        solicitacaoRepository
                                .findByStatusOrderByDataSolicitacaoDesc(
                                        status
                                );
            }
        } else {
            String unidadeUsuario =
                    normalizarUnidade(
                            usuario.getUnidade()
                    );

            if (status == null) {
                solicitacoes =
                        solicitacaoRepository
                                .findByUnidadeOrigemOrderByDataSolicitacaoDesc(
                                        unidadeUsuario
                                );
            } else {
                solicitacoes =
                        solicitacaoRepository
                                .findByUnidadeOrigemAndStatusOrderByDataSolicitacaoAsc(
                                        unidadeUsuario,
                                        status
                                );
            }
        }

        return solicitacoes
                .stream()
                .sorted(
                        Comparator.comparing(
                                SolicitacaoTransferenciaFenoRacao
                                        ::getDataSolicitacao,
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

    @Override
    @Transactional(readOnly = true)
    public List<SolicitacaoTransferenciaFenoRacaoResponseDTO>
    listarEnviadas(
            String matriculaUsuario
    ) {
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

        String unidadeUsuario =
                normalizarUnidade(
                        usuario.getUnidade()
                );

        return solicitacaoRepository
                .findByUnidadeSolicitanteOrderByDataSolicitacaoDesc(
                        unidadeUsuario
                )
                .stream()
                .map(
                        this::converterParaResponse
                )
                .toList();
    }

    @Override
    @Transactional
    public SolicitacaoTransferenciaFenoRacaoResponseDTO negar(
            Long solicitacaoId,
            String observacaoResposta,
            String matriculaUsuario
    ) {
        validarIdSolicitacao(
                solicitacaoId
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

        if (observacaoResposta == null
                || observacaoResposta.isBlank()) {

            throw new BusinessException(
                    "A justificativa da negativa é obrigatória."
            );
        }

        if (observacaoResposta
                .trim()
                .length() > 500) {

            throw new BusinessException(
                    "A justificativa da negativa deve possuir no máximo 500 caracteres."
            );
        }

        SolicitacaoTransferenciaFenoRacao solicitacao =
                buscarSolicitacao(
                        solicitacaoId
                );

        validarUnidadeOrigemParaResposta(
                usuario,
                solicitacao
        );

        if (solicitacao.getStatus()
                != StatusSolicitacaoTransferenciaFenoRacao
                .PENDENTE) {

            throw new ConflictException(
                    "Somente solicitações pendentes podem ser negadas."
            );
        }

        LocalDateTime dataAtual =
                LocalDateTime.now();

        solicitacao.setStatus(
                StatusSolicitacaoTransferenciaFenoRacao
                        .NEGADA
        );

        solicitacao.setRespondidoPorId(
                usuario.getId()
        );

        solicitacao.setDataResposta(
                dataAtual
        );

        solicitacao.setObservacaoResposta(
                observacaoResposta.trim()
        );

        SolicitacaoTransferenciaFenoRacao salva =
                solicitacaoRepository.save(
                        solicitacao
                );

        criarNotificacaoRespostaNegada(
                salva,
                dataAtual
        );

        return converterParaResponse(
                salva
        );
    }

    @Override
    @Transactional
    public SolicitacaoTransferenciaFenoRacaoResponseDTO aprovar(
            Long solicitacaoId,
            AprovarSolicitacaoTransferenciaFenoRacaoRequestDTO request,
            String matriculaUsuario
    ) {
        validarIdSolicitacao(
                solicitacaoId
        );

        if (request == null) {
            throw new BusinessException(
                    "Os dados da aprovação são obrigatórios."
            );
        }

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

        SolicitacaoTransferenciaFenoRacao solicitacao =
                buscarSolicitacao(
                        solicitacaoId
                );

        validarUnidadeOrigemParaResposta(
                usuario,
                solicitacao
        );

        if (solicitacao.getStatus()
                != StatusSolicitacaoTransferenciaFenoRacao.PENDENTE) {

            throw new ConflictException(
                    "Somente solicitações pendentes podem ser aprovadas."
            );
        }

        if (transferenciaRepository.existsBySolicitacaoId(
                solicitacaoId
        )) {
            throw new ConflictException(
                    "Esta solicitação já possui uma transferência registrada."
            );
        }

        List<ItemSolicitacaoTransferenciaFenoRacao> itens =
                itemSolicitacaoRepository
                        .findBySolicitacaoIdOrderByOrdemAtendimentoAsc(
                                solicitacaoId
                        );

        if (itens.isEmpty()) {
            throw new ConflictException(
                    "A solicitação não possui etapas de atendimento planejadas."
            );
        }

        int quantidadeTotalPlanejada =
                itens.stream()
                        .map(
                                ItemSolicitacaoTransferenciaFenoRacao
                                        ::getQuantidadePrevista
                        )
                        .filter(
                                Objects::nonNull
                        )
                        .mapToInt(
                                Integer::intValue
                        )
                        .sum();

        if (quantidadeTotalPlanejada
                != solicitacao.getQuantidadeSolicitada()) {

            throw new ConflictException(
                    "A soma das etapas planejadas não corresponde à quantidade solicitada."
            );
        }

        /*
         * Revalidação antes de qualquer baixa.
         *
         * Caso um lote tenha sofrido movimentação depois
         * da solicitação, toda a aprovação é interrompida.
         */
        for (ItemSolicitacaoTransferenciaFenoRacao item : itens) {

            LoteFenoRacao loteOrigem =
                    loteRepository
                            .findById(
                                    item.getLoteOrigem().getId()
                            )
                            .orElseThrow(() ->
                                    new ResourceNotFoundException(
                                            "Um dos lotes planejados não foi encontrado."
                                    )
                            );

            validarLoteParaTransferencia(
                    loteOrigem,
                    solicitacao,
                    item.getQuantidadePrevista()
            );
        }

        LocalDateTime dataAtual =
                LocalDateTime.now();

        LocalDate dataOperacao =
                dataAtual.toLocalDate();

        BigDecimal pesoUnidadeKg =
                solicitacao.getPesoUnidadeKg();

        Integer quantidadeTotalTransferida =
                solicitacao.getQuantidadeSolicitada();

        BigDecimal pesoTotalTransferidoKg =
                pesoUnidadeKg.multiply(
                        BigDecimal.valueOf(
                                quantidadeTotalTransferida
                        )
                );

        int saldoTotalAnterior =
                itens.stream()
                        .map(
                                ItemSolicitacaoTransferenciaFenoRacao
                                        ::getLoteOrigem
                        )
                        .map(
                                LoteFenoRacao::getQuantidadeAtual
                        )
                        .filter(
                                Objects::nonNull
                        )
                        .mapToInt(
                                Integer::intValue
                        )
                        .sum();

        int saldoTotalPosterior =
                saldoTotalAnterior
                        - quantidadeTotalTransferida;

        String observacao =
                normalizarObservacao(
                        request.observacao()
                );

        /*
         * Registro principal da transferência.
         *
         * Os lotes específicos ficam registrados
         * nos itens da solicitação.
         */
        TransferenciaFenoRacao transferencia =
                TransferenciaFenoRacao
                        .builder()
                        .solicitacao(
                                solicitacao
                        )
                        .produto(
                                solicitacao.getProduto()
                        )
                        .loteOrigem(
                                null
                        )
                        .loteDestino(
                                null
                        )
                        .unidadeOrigem(
                                solicitacao.getUnidadeOrigem()
                        )
                        .unidadeDestino(
                                solicitacao.getUnidadeSolicitante()
                        )
                        .quantidadeTransferida(
                                quantidadeTotalTransferida
                        )
                        .pesoUnidadeKg(
                                pesoUnidadeKg
                        )
                        .pesoTotalKg(
                                pesoTotalTransferidoKg
                        )
                        .saldoAnteriorOrigem(
                                saldoTotalAnterior
                        )
                        .saldoPosteriorOrigem(
                                saldoTotalPosterior
                        )
                        .aprovadoPorId(
                                usuario.getId()
                        )
                        .dataTransferencia(
                                dataAtual
                        )
                        .observacao(
                                observacao
                        )
                        .situacao(
                                SituacaoTransferenciaFenoRacao.CONCLUIDA
                        )
                        .build();

        transferencia =
                transferenciaRepository.save(
                        transferencia
                );

        /*
         * Cada etapa gera:
         *
         * 1. baixa no lote de origem;
         * 2. lote correspondente no destino;
         * 3. movimentação de saída;
         * 4. movimentação de entrada;
         * 5. atualização do item planejado.
         */
        for (ItemSolicitacaoTransferenciaFenoRacao item : itens) {

            LoteFenoRacao loteOrigem =
                    loteRepository
                            .findById(
                                    item.getLoteOrigem().getId()
                            )
                            .orElseThrow(() ->
                                    new ResourceNotFoundException(
                                            "Um dos lotes planejados não foi encontrado."
                                    )
                            );

            Integer quantidadeEtapa =
                    item.getQuantidadePrevista();

            int saldoAnterior =
                    loteOrigem.getQuantidadeAtual();

            int saldoPosterior =
                    saldoAnterior
                            - quantidadeEtapa;

            BigDecimal pesoEtapaKg =
                    pesoUnidadeKg.multiply(
                            BigDecimal.valueOf(
                                    quantidadeEtapa
                            )
                    );

            loteOrigem.setQuantidadeAtual(
                    saldoPosterior
            );

            loteOrigem.setPesoTotalAtualKg(
                    pesoUnidadeKg.multiply(
                            BigDecimal.valueOf(
                                    saldoPosterior
                            )
                    )
            );

            loteOrigem.setUsuarioModificadorId(
                    usuario.getId()
            );

            loteOrigem.setDataModificacao(
                    dataAtual
            );

            loteRepository.save(
                    loteOrigem
            );

            LoteFenoRacao loteDestino =
                    criarLoteDestino(
                            solicitacao,
                            loteOrigem,
                            quantidadeEtapa,
                            pesoEtapaKg,
                            usuario,
                            dataAtual,
                            item.getOrdemAtendimento()
                    );

            loteDestino =
                    loteRepository.save(
                            loteDestino
                    );

            loteDestino.setTransferenciaOrigemId(
                    transferencia.getId()
            );

            loteDestino.setUsuarioModificadorId(
                    usuario.getId()
            );

            loteDestino.setDataModificacao(
                    dataAtual
            );

            loteRepository.save(
                    loteDestino
            );

            MovimentacaoFenoRacao movimentacaoSaida =
                    criarMovimentacaoTransferenciaSaida(
                            transferencia,
                            loteOrigem,
                            usuario,
                            quantidadeEtapa,
                            pesoEtapaKg,
                            saldoAnterior,
                            saldoPosterior,
                            dataOperacao,
                            dataAtual
                    );

            movimentacaoSaida =
                    movimentacaoRepository.save(
                            movimentacaoSaida
                    );

            MovimentacaoFenoRacao movimentacaoEntrada =
                    criarMovimentacaoTransferenciaEntrada(
                            transferencia,
                            loteDestino,
                            movimentacaoSaida,
                            usuario,
                            quantidadeEtapa,
                            pesoEtapaKg,
                            dataOperacao,
                            dataAtual
                    );

            movimentacaoRepository.save(
                    movimentacaoEntrada
            );

            item.setTransferencia(
                    transferencia
            );

            item.setLoteDestino(
                    loteDestino
            );

            item.setQuantidadeAprovada(
                    quantidadeEtapa
            );

            item.setSaldoAnterior(
                    saldoAnterior
            );

            item.setSaldoPosterior(
                    saldoPosterior
            );

            itemSolicitacaoRepository.save(
                    item
            );
        }

        solicitacao.setLoteSelecionado(
                null
        );

        solicitacao.setQuantidadeAprovada(
                quantidadeTotalTransferida
        );

        solicitacao.setPesoTotalAprovadoKg(
                pesoTotalTransferidoKg
        );

        solicitacao.setStatus(
                StatusSolicitacaoTransferenciaFenoRacao.TRANSFERIDA
        );

        solicitacao.setRespondidoPorId(
                usuario.getId()
        );

        solicitacao.setDataResposta(
                dataAtual
        );

        solicitacao.setObservacaoResposta(
                observacao
        );

        SolicitacaoTransferenciaFenoRacao salva =
                solicitacaoRepository.save(
                        solicitacao
                );

        criarNotificacaoTransferenciaAprovada(
                salva,
                quantidadeTotalTransferida,
                dataAtual
        );

        return converterParaResponse(
                salva
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
                    "Somente administradores podem responder solicitações de transferência."
            );
        }
    }

    private void validarAcessoConsulta(
            Usuario usuario,
            SolicitacaoTransferenciaFenoRacao solicitacao
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
                        solicitacao.getUnidadeSolicitante()
                )
                        || unidadeUsuario.equalsIgnoreCase(
                        solicitacao.getUnidadeOrigem()
                );

        if (!unidadeEnvolvida) {
            throw new ForbiddenException(
                    "O usuário não possui acesso a esta solicitação."
            );
        }
    }

    private void validarUnidadeOrigemParaResposta(
            Usuario usuario,
            SolicitacaoTransferenciaFenoRacao solicitacao
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

        if (!unidadeUsuario.equalsIgnoreCase(
                solicitacao.getUnidadeOrigem()
        )) {
            throw new ForbiddenException(
                    "Somente administradores da unidade de origem podem responder esta solicitação."
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

    private List<LoteFenoRacao> buscarLotesValidos(
            Integer produtoId,
            String unidadeOrigem
    ) {
        return loteRepository
                .buscarLotesElegiveisOrdenados(
                        produtoId,
                        unidadeOrigem,
                        SituacaoLoteFenoRacao.ATIVO,
                        LocalDate.now()
                );
    }

    private SolicitacaoTransferenciaFenoRacao buscarSolicitacao(
            Long solicitacaoId
    ) {
        return solicitacaoRepository
                .findById(
                        solicitacaoId
                )
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Solicitação de transferência não encontrada."
                        )
                );
    }

    private void validarIdSolicitacao(
            Long solicitacaoId
    ) {
        if (solicitacaoId == null
                || solicitacaoId <= 0) {

            throw new BusinessException(
                    "O ID da solicitação deve ser maior que zero."
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

    private void validarLoteParaTransferencia(
            LoteFenoRacao lote,
            SolicitacaoTransferenciaFenoRacao solicitacao,
            Integer quantidadeAprovada
    ) {
        if (lote.getUnidade() == null
                || !lote
                .getUnidade()
                .equalsIgnoreCase(
                        solicitacao.getUnidadeOrigem()
                )) {

            throw new ForbiddenException(
                    "O lote selecionado não pertence à unidade de origem da solicitação."
            );
        }

        if (!lote
                .getProduto()
                .getId()
                .equals(
                        solicitacao
                                .getProduto()
                                .getId()
                )) {

            throw new BusinessException(
                    "O lote selecionado não pertence ao produto solicitado."
            );
        }

        if (lote.getSituacao()
                != SituacaoLoteFenoRacao.ATIVO) {

            throw new ConflictException(
                    "O lote selecionado não está ativo."
            );
        }

        if (lote.getValidade() != null
                && lote
                .getValidade()
                .isBefore(
                        LocalDate.now()
                )) {

            throw new ConflictException(
                    "O lote selecionado está vencido."
            );
        }

        if (lote.getQuantidadeAtual() == null
                || lote.getQuantidadeAtual() <= 0) {

            throw new ConflictException(
                    "O lote selecionado não possui saldo disponível."
            );
        }

        if (quantidadeAprovada
                > lote.getQuantidadeAtual()) {

            throw new ConflictException(
                    "O lote selecionado não possui saldo suficiente para a quantidade aprovada."
            );
        }
    }

    private LoteFenoRacao criarLoteDestino(
            SolicitacaoTransferenciaFenoRacao solicitacao,
            LoteFenoRacao loteOrigem,
            Integer quantidadeAprovada,
            BigDecimal pesoTotalKg,
            Usuario usuario,
            LocalDateTime dataAtual,
            Integer ordemAtendimento
    ) {
        return LoteFenoRacao
                .builder()
                .produto(
                        solicitacao.getProduto()
                )
                .codigoLote(
                        gerarCodigoLoteTransferencia(
                                solicitacao.getId(),
                                loteOrigem.getCodigoLote(),
                                ordemAtendimento
                        )
                )
                .quantidadeInicial(
                        quantidadeAprovada
                )
                .quantidadeAtual(
                        quantidadeAprovada
                )
                .pesoTotalInicialKg(
                        pesoTotalKg
                )
                .pesoTotalAtualKg(
                        pesoTotalKg
                )
                .dataEntrada(
                        dataAtual.toLocalDate()
                )
                .validade(
                        loteOrigem.getValidade()
                )
                .fornecedor(
                        loteOrigem.getFornecedor()
                )
                .numeroDocumento(
                        "TRANSFERENCIA-"
                                + solicitacao.getId()
                )
                .transferenciaOrigemId(
                        null
                )
                .responsavelRecebimento(
                        usuario.getNome()
                )
                .observacao(
                        "Lote recebido por transferência da unidade "
                                + solicitacao.getUnidadeOrigem()
                                + ". Lote de origem: "
                                + loteOrigem.getCodigoLote()
                                + "."
                )
                .unidade(
                        solicitacao.getUnidadeSolicitante()
                )
                .situacao(
                        SituacaoLoteFenoRacao.ATIVO
                )
                .usuarioCadastroId(
                        usuario.getId()
                )
                .dataCadastro(
                        dataAtual
                )
                .usuarioModificadorId(
                        null
                )
                .dataModificacao(
                        null
                )
                .build();
    }

    private MovimentacaoFenoRacao
    criarMovimentacaoTransferenciaSaida(
            TransferenciaFenoRacao transferencia,
            LoteFenoRacao loteOrigem,
            Usuario usuario,
            Integer quantidade,
            BigDecimal pesoTotalKg,
            Integer saldoAnterior,
            Integer saldoPosterior,
            LocalDate dataOperacao,
            LocalDateTime dataAtual
    ) {
        return MovimentacaoFenoRacao
                .builder()
                .produto(
                        transferencia.getProduto()
                )
                .lote(
                        loteOrigem
                )
                .tipoMovimentacao(
                        TipoMovimentacaoFenoRacao
                                .TRANSFERENCIA_SAIDA
                )
                .quantidadeUnidades(
                        quantidade
                )
                .pesoUnidadeKg(
                        transferencia.getPesoUnidadeKg()
                )
                .quantidadeSolicitadaKg(
                        pesoTotalKg
                )
                .pesoMovimentadoKg(
                        pesoTotalKg
                )
                .sobraCalculadaKg(
                        BigDecimal.ZERO
                )
                .saldoAnterior(
                        saldoAnterior
                )
                .saldoPosterior(
                        saldoPosterior
                )
                .unidadeOrigem(
                        transferencia.getUnidadeOrigem()
                )
                .unidadeDestino(
                        transferencia.getUnidadeDestino()
                )
                .dataOperacao(
                        dataOperacao
                )
                .servico(
                        "Transferência entre unidades"
                )
                .motivo(
                        "Solicitação de transferência nº "
                                + transferencia
                                .getSolicitacao()
                                .getId()
                )
                .observacao(
                        transferencia.getObservacao()
                )
                .numeroDocumento(
                        "TRANSFERENCIA-"
                                + transferencia.getId()
                )
                .responsavel(
                        usuario.getNome()
                )
                .usuarioId(
                        usuario.getId()
                )
                .usuarioSetor(
                        usuario.getSetor()
                )
                .situacao(
                        SituacaoMovimentacaoFenoRacao
                                .ATIVA
                )
                .movimentacaoOrigem(
                        null
                )
                .transferenciaId(
                        transferencia.getId()
                )
                .dataCadastro(
                        dataAtual
                )
                .usuarioModificadorId(
                        null
                )
                .dataModificacao(
                        null
                )
                .build();
    }

    private MovimentacaoFenoRacao
    criarMovimentacaoTransferenciaEntrada(
            TransferenciaFenoRacao transferencia,
            LoteFenoRacao loteDestino,
            MovimentacaoFenoRacao movimentacaoSaida,
            Usuario usuario,
            Integer quantidade,
            BigDecimal pesoTotalKg,
            LocalDate dataOperacao,
            LocalDateTime dataAtual
    ) {
        return MovimentacaoFenoRacao
                .builder()
                .produto(
                        transferencia.getProduto()
                )
                .lote(
                        loteDestino
                )
                .tipoMovimentacao(
                        TipoMovimentacaoFenoRacao
                                .TRANSFERENCIA_ENTRADA
                )
                .quantidadeUnidades(
                        quantidade
                )
                .pesoUnidadeKg(
                        transferencia.getPesoUnidadeKg()
                )
                .quantidadeSolicitadaKg(
                        pesoTotalKg
                )
                .pesoMovimentadoKg(
                        pesoTotalKg
                )
                .sobraCalculadaKg(
                        BigDecimal.ZERO
                )
                .saldoAnterior(
                        0
                )
                .saldoPosterior(
                        quantidade
                )
                .unidadeOrigem(
                        transferencia.getUnidadeOrigem()
                )
                .unidadeDestino(
                        transferencia.getUnidadeDestino()
                )
                .dataOperacao(
                        dataOperacao
                )
                .servico(
                        "Recebimento de transferência"
                )
                .motivo(
                        "Solicitação de transferência nº "
                                + transferencia
                                .getSolicitacao()
                                .getId()
                )
                .observacao(
                        transferencia.getObservacao()
                )
                .numeroDocumento(
                        "TRANSFERENCIA-"
                                + transferencia.getId()
                )
                .responsavel(
                        usuario.getNome()
                )
                .usuarioId(
                        usuario.getId()
                )
                .usuarioSetor(
                        usuario.getSetor()
                )
                .situacao(
                        SituacaoMovimentacaoFenoRacao
                                .ATIVA
                )
                .movimentacaoOrigem(
                        movimentacaoSaida
                )
                .transferenciaId(
                        transferencia.getId()
                )
                .dataCadastro(
                        dataAtual
                )
                .usuarioModificadorId(
                        null
                )
                .dataModificacao(
                        null
                )
                .build();
    }

    private void criarNotificacaoNovaSolicitacao(
            SolicitacaoTransferenciaFenoRacao solicitacao,
            LocalDateTime dataAtual
    ) {
        NotificacaoFenoRacao notificacao =
                NotificacaoFenoRacao
                        .builder()
                        .unidadeDestino(
                                solicitacao.getUnidadeOrigem()
                        )
                        .titulo(
                                "Nova solicitação de transferência"
                        )
                        .mensagem(
                                "A unidade "
                                        + solicitacao.getUnidadeSolicitante()
                                        + " solicitou "
                                        + solicitacao.getQuantidadeSolicitada()
                                        + " "
                                        + solicitacao
                                        .getProduto()
                                        .getUnidadeControle()
                                        + "(s) de "
                                        + solicitacao
                                        .getProduto()
                                        .getNomeProduto()
                                        + "."
                        )
                        .tipo(
                                TipoNotificacaoFenoRacao
                                        .TRANSFERENCIA_ALIMENTACAO
                        )
                        .solicitacao(
                                solicitacao
                        )
                        .lida(
                                false
                        )
                        .dataCriacao(
                                dataAtual
                        )
                        .dataLeitura(
                                null
                        )
                        .usuarioLeituraId(
                                null
                        )
                        .build();

        notificacaoRepository.save(
                notificacao
        );
    }

    private void criarNotificacaoRespostaNegada(
            SolicitacaoTransferenciaFenoRacao solicitacao,
            LocalDateTime dataAtual
    ) {
        NotificacaoFenoRacao notificacao =
                NotificacaoFenoRacao
                        .builder()
                        .unidadeDestino(
                                solicitacao.getUnidadeSolicitante()
                        )
                        .titulo(
                                "Solicitação de transferência negada"
                        )
                        .mensagem(
                                "A solicitação de transferência nº "
                                        + solicitacao.getId()
                                        + " foi negada pela unidade "
                                        + solicitacao.getUnidadeOrigem()
                                        + "."
                        )
                        .tipo(
                                TipoNotificacaoFenoRacao
                                        .RESPOSTA_TRANSFERENCIA_ALIMENTACAO
                        )
                        .solicitacao(
                                solicitacao
                        )
                        .lida(
                                false
                        )
                        .dataCriacao(
                                dataAtual
                        )
                        .dataLeitura(
                                null
                        )
                        .usuarioLeituraId(
                                null
                        )
                        .build();

        notificacaoRepository.save(
                notificacao
        );
    }

    private void criarNotificacaoTransferenciaAprovada(
            SolicitacaoTransferenciaFenoRacao solicitacao,
            Integer quantidadeAprovada,
            LocalDateTime dataAtual
    ) {
        NotificacaoFenoRacao notificacao =
                NotificacaoFenoRacao
                        .builder()
                        .unidadeDestino(
                                solicitacao.getUnidadeSolicitante()
                        )
                        .titulo(
                                "Transferência de alimentação aprovada"
                        )
                        .mensagem(
                                "A solicitação nº "
                                        + solicitacao.getId()
                                        + " foi aprovada pela unidade "
                                        + solicitacao.getUnidadeOrigem()
                                        + ". Quantidade transferida: "
                                        + quantidadeAprovada
                                        + " "
                                        + solicitacao
                                        .getProduto()
                                        .getUnidadeControle()
                                        + "(s)."
                        )
                        .tipo(
                                TipoNotificacaoFenoRacao
                                        .RESPOSTA_TRANSFERENCIA_ALIMENTACAO
                        )
                        .solicitacao(
                                solicitacao
                        )
                        .lida(
                                false
                        )
                        .dataCriacao(
                                dataAtual
                        )
                        .dataLeitura(
                                null
                        )
                        .usuarioLeituraId(
                                null
                        )
                        .build();

        notificacaoRepository.save(
                notificacao
        );
    }

    private String normalizarObservacao(
            String observacao
    ) {
        if (observacao == null
                || observacao.isBlank()) {

            return null;
        }

        String valor =
                observacao.trim();

        if (valor.length() > 500) {
            throw new BusinessException(
                    "A observação deve possuir no máximo 500 caracteres."
            );
        }

        return valor;
    }

    private String gerarCodigoLoteTransferencia(
            Long solicitacaoId,
            String codigoLoteOrigem,
            Integer ordemAtendimento
    ) {
        String sufixo =
                codigoLoteOrigem == null
                        || codigoLoteOrigem.isBlank()
                        ? "SEM-LOTE"
                        : codigoLoteOrigem.trim();

        String codigo =
                "TR-"
                        + solicitacaoId
                        + "-"
                        + ordemAtendimento
                        + "-"
                        + sufixo;

        if (codigo.length() > 100) {
            return codigo.substring(
                    0,
                    100
            );
        }

        return codigo;
    }

    private void criarItensPlanejados(
            SolicitacaoTransferenciaFenoRacao solicitacao,
            List<LoteFenoRacao> lotesOrdenados,
            Integer quantidadeSolicitada,
            Usuario usuario,
            LocalDateTime dataAtual
    ) {
        int quantidadeRestante =
                quantidadeSolicitada;

        int ordemAtendimento =
                1;

        for (LoteFenoRacao lote : lotesOrdenados) {

            if (quantidadeRestante <= 0) {
                break;
            }

            Integer saldoDisponivel =
                    lote.getQuantidadeAtual();

            if (saldoDisponivel == null
                    || saldoDisponivel <= 0) {

                continue;
            }

            int quantidadePrevista =
                    Math.min(
                            saldoDisponivel,
                            quantidadeRestante
                    );

            ItemSolicitacaoTransferenciaFenoRacao item =
                    ItemSolicitacaoTransferenciaFenoRacao
                            .builder()
                            .solicitacao(
                                    solicitacao
                            )
                            .transferencia(
                                    null
                            )
                            .loteOrigem(
                                    lote
                            )
                            .loteDestino(
                                    null
                            )
                            .saldoDisponivelPlanejamento(
                                    saldoDisponivel
                            )
                            .quantidadePrevista(
                                    quantidadePrevista
                            )
                            .quantidadeAprovada(
                                    null
                            )
                            .ordemAtendimento(
                                    ordemAtendimento
                            )
                            .saldoAnterior(
                                    null
                            )
                            .saldoPosterior(
                                    null
                            )
                            .usuarioCadastroId(
                                    Math.toIntExact(
                                            usuario.getId()
                                    )
                            )
                            .dataCadastro(
                                    dataAtual
                            )
                            .build();

            itemSolicitacaoRepository.save(
                    item
            );

            quantidadeRestante -=
                    quantidadePrevista;

            ordemAtendimento++;
        }

        if (quantidadeRestante > 0) {
            throw new ConflictException(
                    "Não foi possível distribuir toda a quantidade solicitada entre os lotes disponíveis."
            );
        }
    }

    private SolicitacaoTransferenciaFenoRacaoResponseDTO
    converterParaResponse(
            SolicitacaoTransferenciaFenoRacao solicitacao
    ) {
        LoteFenoRacao lote =
                solicitacao.getLoteSelecionado();

        String solicitadoPorNome =
                buscarNomeUsuario(
                        solicitacao.getSolicitadoPorId()
                );

        String respondidoPorNome =
                buscarNomeUsuario(
                        solicitacao.getRespondidoPorId()
                );

        return new SolicitacaoTransferenciaFenoRacaoResponseDTO(
                solicitacao.getId(),
                solicitacao.getProduto().getId(),
                solicitacao.getProduto().getTipoProduto(),
                solicitacao.getProduto().getNomeProduto(),
                solicitacao.getProduto().getUnidadeControle(),
                lote != null
                        ? lote.getId()
                        : null,
                lote != null
                        ? lote.getCodigoLote()
                        : null,
                solicitacao.getUnidadeSolicitante(),
                solicitacao.getUnidadeOrigem(),
                solicitacao.getQuantidadeSolicitada(),
                solicitacao.getQuantidadeAprovada(),
                solicitacao.getPesoUnidadeKg(),
                solicitacao.getPesoTotalSolicitadoKg(),
                solicitacao.getPesoTotalAprovadoKg(),
                solicitacao.getQuantidadeDisponivelNoPedido(),
                solicitacao.getSaldoPrevistoOrigem(),
                solicitacao.getJustificativa(),
                solicitacao.getStatus(),
                solicitacao.getSolicitadoPorId(),
                solicitadoPorNome,
                solicitacao.getDataSolicitacao(),
                solicitacao.getRespondidoPorId(),
                respondidoPorNome,
                solicitacao.getDataResposta(),
                solicitacao.getObservacaoResposta(),
                converterItensParaResponse(
                        solicitacao.getId()
                )
        );
    }

    private List<ItemSolicitacaoTransferenciaFenoRacaoResponseDTO>
    converterItensParaResponse(
            Long solicitacaoId
    ) {
        return itemSolicitacaoRepository
                .findBySolicitacaoIdOrderByOrdemAtendimentoAsc(
                        solicitacaoId
                )
                .stream()
                .map(item -> {
                    LoteFenoRacao loteOrigem =
                            item.getLoteOrigem();

                    LoteFenoRacao loteDestino =
                            item.getLoteDestino();

                    return new ItemSolicitacaoTransferenciaFenoRacaoResponseDTO(
                            item.getId(),
                            item.getOrdemAtendimento(),
                            loteOrigem.getId(),
                            loteOrigem.getCodigoLote(),
                            loteOrigem.getDataEntrada(),
                            loteOrigem.getValidade(),
                            item.getSaldoDisponivelPlanejamento(),
                            item.getQuantidadePrevista(),
                            item.getQuantidadeAprovada(),
                            item.getSaldoAnterior(),
                            item.getSaldoPosterior(),
                            loteDestino != null
                                    ? loteDestino.getId()
                                    : null,
                            loteDestino != null
                                    ? loteDestino.getCodigoLote()
                                    : null
                    );
                })
                .toList();
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