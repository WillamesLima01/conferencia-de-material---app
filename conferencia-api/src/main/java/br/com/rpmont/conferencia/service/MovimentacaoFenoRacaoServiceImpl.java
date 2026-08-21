package br.com.rpmont.conferencia.service;

import br.com.rpmont.conferencia.dtos.AjustarExtravioFenoRacaoRequestDTO;
import br.com.rpmont.conferencia.dtos.CancelarExtravioFenoRacaoRequestDTO;
import br.com.rpmont.conferencia.dtos.CancelarMovimentacaoFenoRacaoRequestDTO;
import br.com.rpmont.conferencia.dtos.MovimentacaoFenoRacaoResponseDTO;
import br.com.rpmont.conferencia.dtos.RegistrarExtravioFenoRacaoRequestDTO;
import br.com.rpmont.conferencia.dtos.RegistrarSaidaFenoRacaoRequestDTO;
import br.com.rpmont.conferencia.enums.SituacaoAnaliseExtravioFenoRacao;
import br.com.rpmont.conferencia.enums.SituacaoLoteFenoRacao;
import br.com.rpmont.conferencia.enums.SituacaoMovimentacaoFenoRacao;
import br.com.rpmont.conferencia.enums.TipoMovimentacaoFenoRacao;
import br.com.rpmont.conferencia.enums.TipoNotificacaoFenoRacao;
import br.com.rpmont.conferencia.enums.TipoProdutoFenoRacao;
import br.com.rpmont.conferencia.exception.BusinessException;
import br.com.rpmont.conferencia.exception.ConflictException;
import br.com.rpmont.conferencia.exception.ForbiddenException;
import br.com.rpmont.conferencia.exception.ResourceNotFoundException;
import br.com.rpmont.conferencia.model.LoteFenoRacao;
import br.com.rpmont.conferencia.model.MovimentacaoFenoRacao;
import br.com.rpmont.conferencia.model.NotificacaoFenoRacao;
import br.com.rpmont.conferencia.model.ProdutoFenoRacao;
import br.com.rpmont.conferencia.model.Usuario;
import br.com.rpmont.conferencia.repository.LoteFenoRacaoRepository;
import br.com.rpmont.conferencia.repository.MovimentacaoFenoRacaoRepository;
import br.com.rpmont.conferencia.repository.NotificacaoFenoRacaoRepository;
import br.com.rpmont.conferencia.repository.UsuarioRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MovimentacaoFenoRacaoServiceImpl
        implements MovimentacaoFenoRacaoService {

    private static final int NIVEL_ADMIN_MASTER = 1;
    private static final int NIVEL_ADMIN = 2;
    private static final int NIVEL_USUARIO_COMUM = 3;
    private static final String STATUS_LIBERADO = "LIBERADO";

    private final MovimentacaoFenoRacaoRepository movimentacaoRepository;
    private final LoteFenoRacaoRepository loteRepository;
    private final UsuarioRepository usuarioRepository;
    private final NotificacaoFenoRacaoRepository notificacaoRepository;
    private final EntityManager entityManager;
    private final NotificacaoFenoRacaoService notificacaoFenoRacaoService;

    /*
     * ==========================================
     * REGISTRAR SAÍDA
     * ==========================================
     */

    @Override
    @Transactional
    public MovimentacaoFenoRacaoResponseDTO registrarSaida(
            RegistrarSaidaFenoRacaoRequestDTO request,
            String matriculaUsuario
    ) {
        Usuario usuarioLogado =
                buscarUsuarioAutenticado(
                        matriculaUsuario
                );

        validarAcessoAoModulo(
                usuarioLogado
        );

        validarRequestSaida(
                request
        );

        validarDataOperacao(
                request.dataSaida(),
                "A data da saída não pode ser futura."
        );

        LoteFenoRacao lote =
                buscarLoteParaSaida(
                        request.loteId(),
                        usuarioLogado
                );

        validarLoteDisponivel(
                lote
        );

        BigDecimal quantidadeNecessariaKg =
                normalizarQuantidadeKg(
                        request.quantidadeNecessariaKg()
                );

        BigDecimal pesoUnidadeKg =
                lote.getProduto()
                        .getPesoUnidadeKg();

        int quantidadeUnidades =
                quantidadeNecessariaKg
                        .divide(
                                pesoUnidadeKg,
                                0,
                                RoundingMode.CEILING
                        )
                        .intValueExact();

        validarSaldoDisponivel(
                lote,
                quantidadeUnidades
        );

        BigDecimal pesoMovimentadoKg =
                pesoUnidadeKg.multiply(
                        BigDecimal.valueOf(
                                quantidadeUnidades
                        )
                );

        BigDecimal sobraCalculadaKg =
                pesoMovimentadoKg.subtract(
                        quantidadeNecessariaKg
                );

        int saldoAnterior =
                lote.getQuantidadeAtual();

        int saldoPosterior =
                saldoAnterior -
                        quantidadeUnidades;

        atualizarSaldoLote(
                lote,
                saldoPosterior,
                usuarioLogado
        );

        MovimentacaoFenoRacao movimentacao =
                new MovimentacaoFenoRacao();

        movimentacao.setProduto(
                lote.getProduto()
        );

        movimentacao.setLote(
                lote
        );

        movimentacao.setTipoMovimentacao(
                TipoMovimentacaoFenoRacao.SAIDA
        );

        movimentacao.setQuantidadeUnidades(
                quantidadeUnidades
        );

        movimentacao.setPesoUnidadeKg(
                pesoUnidadeKg
        );

        movimentacao.setQuantidadeSolicitadaKg(
                quantidadeNecessariaKg
        );

        movimentacao.setPesoMovimentadoKg(
                pesoMovimentadoKg
        );

        movimentacao.setSobraCalculadaKg(
                sobraCalculadaKg
        );

        movimentacao.setSaldoAnterior(
                saldoAnterior
        );

        movimentacao.setSaldoPosterior(
                saldoPosterior
        );

        movimentacao.setUnidadeOrigem(
                lote.getUnidade()
        );

        movimentacao.setUnidadeDestino(
                null
        );

        movimentacao.setDataOperacao(
                request.dataSaida()
        );

        movimentacao.setServico(
                normalizarTextoObrigatorio(
                        request.servico(),
                        "O serviço é obrigatório."
                )
        );

        movimentacao.setMotivo(
                null
        );

        movimentacao.setObservacao(
                normalizarTextoOpcional(
                        request.observacao()
                )
        );

        movimentacao.setNumeroDocumento(
                normalizarTextoOpcional(
                        request.numeroDocumento()
                )
        );

        movimentacao.setResponsavel(
                normalizarTextoObrigatorio(
                        request.responsavel(),
                        "O responsável pela retirada é obrigatório."
                )
        );

        movimentacao.setUsuarioId(
                usuarioLogado.getId()
        );

        movimentacao.setUsuarioSetor(
                normalizarTextoOpcional(
                        usuarioLogado.getSetor()
                )
        );

        movimentacao.setSituacao(
                SituacaoMovimentacaoFenoRacao.ATIVA
        );

        LocalDateTime dataAtual =
                LocalDateTime.now();

        movimentacao.setDataCadastro(
                dataAtual
        );

        movimentacao.setUsuarioModificadorId(
                usuarioLogado.getId()
        );

        movimentacao.setDataModificacao(
                dataAtual
        );

        MovimentacaoFenoRacao salva =
                movimentacaoRepository.saveAndFlush(
                        movimentacao
                );

        entityManager.refresh(
                salva
        );

        return converterParaResponse(
                salva
        );
    }

    /*
     * ==========================================
     * REGISTRAR EXTRAVIO
     * ==========================================
     */

    @Override
    @Transactional
    public MovimentacaoFenoRacaoResponseDTO registrarExtravio(
            RegistrarExtravioFenoRacaoRequestDTO request,
            String matriculaUsuario
    ) {
        Usuario usuarioLogado =
                buscarUsuarioAutenticado(
                        matriculaUsuario
                );

        validarAcessoAoModulo(
                usuarioLogado
        );

        validarUsuarioPodeRegistrarExtravio(
                usuarioLogado
        );

        validarRequestExtravio(
                request
        );

        validarDataOperacao(
                request.dataExtravio(),
                "A data do extravio não pode ser futura."
        );

        LoteFenoRacao lote =
                buscarLoteComPermissao(
                        request.loteId(),
                        usuarioLogado
                );

        validarLoteDisponivel(
                lote
        );

        int quantidadeExtraviada =
                request.quantidadeExtraviada();

        validarSaldoDisponivel(
                lote,
                quantidadeExtraviada
        );

        int saldoAnterior =
                lote.getQuantidadeAtual();

        int saldoPosterior =
                saldoAnterior -
                        quantidadeExtraviada;

        BigDecimal pesoMovimentadoKg =
                lote.getProduto()
                        .getPesoUnidadeKg()
                        .multiply(
                                BigDecimal.valueOf(
                                        quantidadeExtraviada
                                )
                        );

        atualizarSaldoLote(
                lote,
                saldoPosterior,
                usuarioLogado
        );

        MovimentacaoFenoRacao movimentacao =
                new MovimentacaoFenoRacao();

        movimentacao.setProduto(
                lote.getProduto()
        );

        movimentacao.setLote(
                lote
        );

        movimentacao.setTipoMovimentacao(
                TipoMovimentacaoFenoRacao.EXTRAVIO
        );

        movimentacao.setQuantidadeUnidades(
                quantidadeExtraviada
        );

        movimentacao.setPesoUnidadeKg(
                lote.getProduto()
                        .getPesoUnidadeKg()
        );

        movimentacao.setQuantidadeSolicitadaKg(
                pesoMovimentadoKg
        );

        movimentacao.setPesoMovimentadoKg(
                pesoMovimentadoKg
        );

        movimentacao.setSobraCalculadaKg(
                BigDecimal.ZERO
        );

        movimentacao.setSaldoAnterior(
                saldoAnterior
        );

        movimentacao.setSaldoPosterior(
                saldoPosterior
        );

        movimentacao.setUnidadeOrigem(
                lote.getUnidade()
        );

        movimentacao.setDataOperacao(
                request.dataExtravio()
        );

        movimentacao.setMotivo(
                normalizarTextoObrigatorio(
                        request.motivo(),
                        "O motivo do extravio é obrigatório."
                )
        );

        movimentacao.setObservacao(
                normalizarTextoOpcional(
                        request.observacao()
                )
        );

        movimentacao.setNumeroDocumento(
                normalizarTextoOpcional(
                        request.numeroDocumento()
                )
        );

        movimentacao.setResponsavel(
                normalizarTextoObrigatorio(
                        request.responsavel(),
                        "O responsável pelo registro é obrigatório."
                )
        );

        movimentacao.setUsuarioId(
                usuarioLogado.getId()
        );

        movimentacao.setUsuarioSetor(
                normalizarTextoOpcional(
                        usuarioLogado.getSetor()
                )
        );

        movimentacao.setSituacao(
                SituacaoMovimentacaoFenoRacao.ATIVA
        );

        if (usuarioEhAdministrador(usuarioLogado)) {

            movimentacao.setSituacaoAnaliseExtravio(
                    SituacaoAnaliseExtravioFenoRacao.CONFIRMADO
            );

            movimentacao.setQuantidadeConfirmada(
                    quantidadeExtraviada
            );

            movimentacao.setQuantidadeDevolvida(
                    0
            );

            movimentacao.setUsuarioAnaliseId(
                    usuarioLogado.getId()
            );

            movimentacao.setDataAnalise(
                    LocalDateTime.now()
            );

            movimentacao.setMotivoAnalise(
                    "Extravio registrado diretamente por administrador."
            );

        } else {

            movimentacao.setSituacaoAnaliseExtravio(
                    SituacaoAnaliseExtravioFenoRacao.PENDENTE_ANALISE
            );

            movimentacao.setQuantidadeConfirmada(
                    null
            );

            movimentacao.setQuantidadeDevolvida(
                    0
            );

            movimentacao.setUsuarioAnaliseId(
                    null
            );

            movimentacao.setDataAnalise(
                    null
            );

            movimentacao.setMotivoAnalise(
                    null
            );
        }

        LocalDateTime dataAtual =
                LocalDateTime.now();

        movimentacao.setDataCadastro(
                dataAtual
        );

        movimentacao.setUsuarioModificadorId(
                usuarioLogado.getId()
        );

        movimentacao.setDataModificacao(
                dataAtual
        );

        MovimentacaoFenoRacao salva =
                movimentacaoRepository.saveAndFlush(
                        movimentacao
                );

        entityManager.refresh(
                salva
        );

        /*
         * Usuário comum:
         *
         * O extravio fica pendente de análise e
         * os administradores responsáveis da
         * unidade recebem notificação individual.
         */
        if (
                salva.getSituacaoAnaliseExtravio() ==
                        SituacaoAnaliseExtravioFenoRacao.PENDENTE_ANALISE
        ) {
            criarNotificacoesExtravioPendente(
                    salva
            );
        }

        return converterParaResponse(
                salva
        );
    }

    /*
     * ==========================================
     * NOTIFICAÇÃO DE EXTRAVIO
     * ==========================================
     */

    private void criarNotificacoesExtravioPendente(
            MovimentacaoFenoRacao movimentacao
    ) {
        String unidade =
                normalizarTextoObrigatorio(
                        movimentacao.getUnidadeOrigem(),
                        "A unidade do extravio é obrigatória."
                );

        List<Usuario> destinatarios =
                usuarioRepository
                        .buscarAdministradoresResponsaveisPorExtravio(
                                unidade
                        );

        if (
                destinatarios == null ||
                        destinatarios.isEmpty()
        ) {
            return;
        }

        LocalDateTime dataCriacao =
                LocalDateTime.now();

        for (Usuario destinatario : destinatarios) {

            NotificacaoFenoRacao notificacao =
                    new NotificacaoFenoRacao();

            notificacao.setUnidadeDestino(
                    unidade
            );

            notificacao.setTitulo(
                    "Extravio aguardando análise"
            );

            notificacao.setMensagem(
                    montarMensagemNotificacaoExtravio(
                            movimentacao
                    )
            );

            notificacao.setTipo(
                    TipoNotificacaoFenoRacao.EXTRAVIO_PENDENTE_ANALISE
            );

            notificacao.setSolicitacao(
                    null
            );

            notificacao.setUsuarioDestinoId(
                    destinatario.getId()
            );

            notificacao.setMovimentacaoId(
                    movimentacao.getId()
            );

            notificacao.setLida(
                    false
            );

            notificacao.setDataCriacao(
                    dataCriacao
            );

            notificacao.setDataLeitura(
                    null
            );

            notificacao.setUsuarioLeituraId(
                    null
            );

            notificacaoRepository.save(
                    notificacao
            );
        }
    }

    private String montarMensagemNotificacaoExtravio(
            MovimentacaoFenoRacao movimentacao
    ) {
        String produto =
                movimentacao.getProduto() != null
                        ? movimentacao
                        .getProduto()
                        .getNomeProduto()
                        : "Feno/Ração";

        String lote =
                movimentacao.getLote() != null
                        ? movimentacao
                        .getLote()
                        .getCodigoLote()
                        : "não informado";

        return "Foi registrado um extravio de "
                + movimentacao.getQuantidadeUnidades()
                + " unidade(s) de "
                + produto
                + ", lote "
                + lote
                + ", na unidade "
                + movimentacao.getUnidadeOrigem()
                + ". A ocorrência aguarda análise administrativa.";
    }

    /*
     * ==========================================
     * CONFIRMAR EXTRAVIO
     * ==========================================
     */

    @Override
    @Transactional
    public MovimentacaoFenoRacaoResponseDTO confirmarExtravio(
            Long movimentacaoId,
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

        MovimentacaoFenoRacao original =
                buscarMovimentacaoPorId(
                        movimentacaoId
                );

        validarAcessoMovimentacao(
                original,
                usuarioLogado
        );

        validarExtravioPendenteAnalise(
                original
        );

        int quantidadeOriginal =
                original.getQuantidadeUnidades();

        LocalDateTime dataAtual =
                LocalDateTime.now();

        original.setSituacaoAnaliseExtravio(
                SituacaoAnaliseExtravioFenoRacao.CONFIRMADO
        );

        original.setQuantidadeConfirmada(
                quantidadeOriginal
        );

        original.setQuantidadeDevolvida(
                0
        );

        original.setUsuarioAnaliseId(
                usuarioLogado.getId()
        );

        original.setDataAnalise(
                dataAtual
        );

        original.setMotivoAnalise(
                "Extravio confirmado integralmente pelo administrador."
        );

        original.setUsuarioModificadorId(
                usuarioLogado.getId()
        );

        original.setDataModificacao(
                dataAtual
        );

        MovimentacaoFenoRacao salva =
                movimentacaoRepository.saveAndFlush(
                        original
                );

        entityManager.refresh(
                salva
        );

        notificacaoFenoRacaoService
                .concluirNotificacoesExtravio(
                        salva.getId(),
                        usuarioLogado.getId()
                );

        return converterParaResponse(
                salva
        );
    }

    /*
     * ==========================================
     * AJUSTAR EXTRAVIO
     * ==========================================
     */

    @Override
    @Transactional
    public MovimentacaoFenoRacaoResponseDTO ajustarExtravio(
            Long movimentacaoId,
            AjustarExtravioFenoRacaoRequestDTO request,
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

        validarRequestAjusteExtravio(
                request
        );

        MovimentacaoFenoRacao original =
                buscarMovimentacaoPorId(
                        movimentacaoId
                );

        validarAcessoMovimentacao(
                original,
                usuarioLogado
        );

        validarExtravioPendenteAnalise(
                original
        );

        int quantidadeOriginal =
                original.getQuantidadeUnidades();

        int quantidadeConfirmada =
                request.quantidadeConfirmada();

        if (quantidadeConfirmada >= quantidadeOriginal) {
            throw new BusinessException(
                    "No ajuste, a quantidade confirmada deve ser menor que a quantidade originalmente informada."
            );
        }

        int quantidadeDevolvida =
                quantidadeOriginal -
                        quantidadeConfirmada;

        LoteFenoRacao lote =
                original.getLote();

        int saldoAnterior =
                lote.getQuantidadeAtual();

        int saldoPosterior =
                saldoAnterior +
                        quantidadeDevolvida;

        restaurarSaldoLoteExtravio(
                lote,
                saldoPosterior,
                usuarioLogado
        );

        LocalDateTime dataAtual =
                LocalDateTime.now();

        original.setSituacaoAnaliseExtravio(
                SituacaoAnaliseExtravioFenoRacao.AJUSTADO
        );

        original.setQuantidadeConfirmada(
                quantidadeConfirmada
        );

        original.setQuantidadeDevolvida(
                quantidadeDevolvida
        );

        original.setUsuarioAnaliseId(
                usuarioLogado.getId()
        );

        original.setDataAnalise(
                dataAtual
        );

        original.setMotivoAnalise(
                normalizarTextoObrigatorio(
                        request.motivo(),
                        "O motivo do ajuste é obrigatório."
                )
        );

        original.setUsuarioModificadorId(
                usuarioLogado.getId()
        );

        original.setDataModificacao(
                dataAtual
        );

        movimentacaoRepository.save(
                original
        );

        MovimentacaoFenoRacao ajuste =
                criarMovimentacaoRetornoExtravio(
                        original,
                        lote,
                        TipoMovimentacaoFenoRacao.AJUSTE_EXTRAVIO,
                        quantidadeDevolvida,
                        saldoAnterior,
                        saldoPosterior,
                        request.motivo(),
                        usuarioLogado
                );

        movimentacaoRepository.saveAndFlush(
                ajuste
        );

        MovimentacaoFenoRacao salva =
                movimentacaoRepository.saveAndFlush(
                        original
                );

        entityManager.refresh(
                salva
        );

        notificacaoFenoRacaoService
                .concluirNotificacoesExtravio(
                        salva.getId(),
                        usuarioLogado.getId()
                );

        return converterParaResponse(
                salva
        );
    }

    /*
     * ==========================================
     * CANCELAR EXTRAVIO
     * ==========================================
     */

    @Override
    @Transactional
    public MovimentacaoFenoRacaoResponseDTO cancelarExtravio(
            Long movimentacaoId,
            CancelarExtravioFenoRacaoRequestDTO request,
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

        validarRequestCancelamentoExtravio(
                request
        );

        MovimentacaoFenoRacao original =
                buscarMovimentacaoPorId(
                        movimentacaoId
                );

        validarAcessoMovimentacao(
                original,
                usuarioLogado
        );

        validarExtravioPendenteAnalise(
                original
        );

        int quantidadeOriginal =
                original.getQuantidadeUnidades();

        LoteFenoRacao lote =
                original.getLote();

        int saldoAnterior =
                lote.getQuantidadeAtual();

        int saldoPosterior =
                saldoAnterior +
                        quantidadeOriginal;

        restaurarSaldoLoteExtravio(
                lote,
                saldoPosterior,
                usuarioLogado
        );

        LocalDateTime dataAtual =
                LocalDateTime.now();

        original.setSituacaoAnaliseExtravio(
                SituacaoAnaliseExtravioFenoRacao.CANCELADO
        );

        original.setQuantidadeConfirmada(
                0
        );

        original.setQuantidadeDevolvida(
                quantidadeOriginal
        );

        original.setUsuarioAnaliseId(
                usuarioLogado.getId()
        );

        original.setDataAnalise(
                dataAtual
        );

        original.setMotivoAnalise(
                normalizarTextoObrigatorio(
                        request.motivo(),
                        "O motivo do cancelamento é obrigatório."
                )
        );

        original.setUsuarioModificadorId(
                usuarioLogado.getId()
        );

        original.setDataModificacao(
                dataAtual
        );

        movimentacaoRepository.save(
                original
        );

        MovimentacaoFenoRacao cancelamento =
                criarMovimentacaoRetornoExtravio(
                        original,
                        lote,
                        TipoMovimentacaoFenoRacao.CANCELAMENTO_EXTRAVIO,
                        quantidadeOriginal,
                        saldoAnterior,
                        saldoPosterior,
                        request.motivo(),
                        usuarioLogado
                );

        movimentacaoRepository.saveAndFlush(
                cancelamento
        );

        MovimentacaoFenoRacao salva =
                movimentacaoRepository.saveAndFlush(
                        original
                );

        entityManager.refresh(
                salva
        );

        notificacaoFenoRacaoService
                .concluirNotificacoesExtravio(
                        salva.getId(),
                        usuarioLogado.getId()
                );

        return converterParaResponse(
                salva
        );
    }

    /*
     * ==========================================
     * BUSCAR POR ID
     * ==========================================
     */

    @Override
    @Transactional(readOnly = true)
    public MovimentacaoFenoRacaoResponseDTO buscarPorId(
            Long movimentacaoId,
            String matriculaUsuario
    ) {
        Usuario usuarioLogado =
                buscarUsuarioAutenticado(
                        matriculaUsuario
                );

        validarAcessoAoModulo(
                usuarioLogado
        );

        MovimentacaoFenoRacao movimentacao =
                buscarMovimentacaoPorId(
                        movimentacaoId
                );

        validarAcessoMovimentacao(
                movimentacao,
                usuarioLogado
        );

        return converterParaResponse(
                movimentacao
        );
    }

    /*
     * ==========================================
     * LISTAR POR LOTE
     * ==========================================
     */

    @Override
    @Transactional(readOnly = true)
    public List<MovimentacaoFenoRacaoResponseDTO> listarPorLote(
            Integer loteId,
            String matriculaUsuario
    ) {
        Usuario usuarioLogado =
                buscarUsuarioAutenticado(
                        matriculaUsuario
                );

        validarAcessoAoModulo(
                usuarioLogado
        );

        buscarLoteComPermissao(
                loteId,
                usuarioLogado
        );

        return movimentacaoRepository
                .findByLoteIdOrderByDataOperacaoDescDataCadastroDesc(
                        loteId
                )
                .stream()
                .map(
                        this::converterParaResponse
                )
                .toList();
    }

    /*
     * ==========================================
     * CONSULTAR
     * ==========================================
     */

    @Override
    @Transactional(readOnly = true)
    public List<MovimentacaoFenoRacaoResponseDTO> consultar(
            LocalDate dataInicial,
            LocalDate dataFinal,
            TipoProdutoFenoRacao tipoProduto,
            TipoMovimentacaoFenoRacao tipoMovimentacao,
            String unidade,
            String matriculaUsuario
    ) {
        Usuario usuarioLogado =
                buscarUsuarioAutenticado(
                        matriculaUsuario
                );

        validarAcessoAoModulo(
                usuarioLogado
        );

        validarPeriodo(
                dataInicial,
                dataFinal
        );

        String unidadeConsulta =
                definirUnidadeConsulta(
                        unidade,
                        usuarioLogado
                );

        List<MovimentacaoFenoRacao> movimentacoes;

        if (tipoMovimentacao == null) {

            movimentacoes =
                    movimentacaoRepository
                            .consultarPorUnidadeEPeriodo(
                                    unidadeConsulta,
                                    dataInicial,
                                    dataFinal
                            );

        } else {

            movimentacoes =
                    movimentacaoRepository
                            .consultarPorTipoUnidadeEPeriodo(
                                    tipoMovimentacao,
                                    unidadeConsulta,
                                    dataInicial,
                                    dataFinal
                            );
        }

        return movimentacoes
                .stream()
                .filter(
                        movimentacao ->
                                tipoProduto == null ||
                                        movimentacao
                                                .getProduto()
                                                .getTipoProduto() ==
                                                tipoProduto
                )
                .map(
                        this::converterParaResponse
                )
                .toList();
    }

    /*
     * ==========================================
     * CANCELAR SAÍDA
     * ==========================================
     */

    @Override
    @Transactional
    public MovimentacaoFenoRacaoResponseDTO cancelar(
            Long movimentacaoId,
            CancelarMovimentacaoFenoRacaoRequestDTO request,
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

        validarRequestCancelamento(
                request
        );

        MovimentacaoFenoRacao original =
                buscarMovimentacaoPorId(
                        movimentacaoId
                );

        validarAcessoMovimentacao(
                original,
                usuarioLogado
        );

        validarMovimentacaoCancelavel(
                original
        );

        LoteFenoRacao lote =
                original.getLote();

        int saldoAnteriorCancelamento =
                lote.getQuantidadeAtual();

        int saldoPosteriorCancelamento =
                saldoAnteriorCancelamento +
                        original.getQuantidadeUnidades();

        lote.setQuantidadeAtual(
                saldoPosteriorCancelamento
        );

        lote.setPesoTotalAtualKg(
                lote.getProduto()
                        .getPesoUnidadeKg()
                        .multiply(
                                BigDecimal.valueOf(
                                        saldoPosteriorCancelamento
                                )
                        )
        );

        lote.setSituacao(
                SituacaoLoteFenoRacao.ATIVO
        );

        lote.setUsuarioModificadorId(
                usuarioLogado.getId()
        );

        lote.setDataModificacao(
                LocalDateTime.now()
        );

        loteRepository.save(
                lote
        );

        original.setSituacao(
                SituacaoMovimentacaoFenoRacao.CANCELADA
        );

        original.setUsuarioModificadorId(
                usuarioLogado.getId()
        );

        original.setDataModificacao(
                LocalDateTime.now()
        );

        movimentacaoRepository.save(
                original
        );

        MovimentacaoFenoRacao cancelamento =
                new MovimentacaoFenoRacao();

        cancelamento.setProduto(
                original.getProduto()
        );

        cancelamento.setLote(
                lote
        );

        cancelamento.setTipoMovimentacao(
                TipoMovimentacaoFenoRacao.CANCELAMENTO_SAIDA
        );

        cancelamento.setQuantidadeUnidades(
                original.getQuantidadeUnidades()
        );

        cancelamento.setPesoUnidadeKg(
                original.getPesoUnidadeKg()
        );

        cancelamento.setQuantidadeSolicitadaKg(
                original.getQuantidadeSolicitadaKg()
        );

        cancelamento.setPesoMovimentadoKg(
                original.getPesoMovimentadoKg()
        );

        cancelamento.setSobraCalculadaKg(
                original.getSobraCalculadaKg()
        );

        cancelamento.setSaldoAnterior(
                saldoAnteriorCancelamento
        );

        cancelamento.setSaldoPosterior(
                saldoPosteriorCancelamento
        );

        cancelamento.setUnidadeDestino(
                lote.getUnidade()
        );

        cancelamento.setDataOperacao(
                LocalDate.now()
        );

        cancelamento.setMotivo(
                normalizarTextoObrigatorio(
                        request.motivo(),
                        "O motivo do cancelamento é obrigatório."
                )
        );

        cancelamento.setObservacao(
                normalizarTextoOpcional(
                        request.observacao()
                )
        );

        cancelamento.setNumeroDocumento(
                original.getNumeroDocumento()
        );

        cancelamento.setResponsavel(
                original.getResponsavel()
        );

        cancelamento.setUsuarioId(
                usuarioLogado.getId()
        );

        cancelamento.setUsuarioSetor(
                normalizarTextoOpcional(
                        usuarioLogado.getSetor()
                )
        );

        cancelamento.setSituacao(
                SituacaoMovimentacaoFenoRacao.ATIVA
        );

        cancelamento.setMovimentacaoOrigem(
                original
        );

        LocalDateTime dataAtualCancelamento =
                LocalDateTime.now();

        cancelamento.setDataCadastro(
                dataAtualCancelamento
        );

        cancelamento.setUsuarioModificadorId(
                usuarioLogado.getId()
        );

        cancelamento.setDataModificacao(
                dataAtualCancelamento
        );

        MovimentacaoFenoRacao salva =
                movimentacaoRepository.saveAndFlush(
                        cancelamento
                );

        entityManager.refresh(
                salva
        );

        return converterParaResponse(
                salva
        );
    }

    /*
     * ==========================================
     * BUSCAS
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
     * BUSCAR LOTE PARA SAÍDA
     * ==========================================
     *
     * A saída é uma operação física/operacional
     * da unidade. Por isso, inclusive o
     * ADMIN_MASTER só pode retirar estoque de
     * lote pertencente à própria unidade.
     */
    private LoteFenoRacao buscarLoteParaSaida(
            Integer loteId,
            Usuario usuario
    ) {
        if (loteId == null) {
            throw new BusinessException(
                    "O lote é obrigatório."
            );
        }

        if (usuario == null) {
            throw new ForbiddenException(
                    "Usuário autenticado não identificado."
            );
        }

        String unidadeUsuario =
                normalizarTextoObrigatorio(
                        usuario.getUnidade(),
                        "O usuário não possui unidade cadastrada."
                );

        return loteRepository
                .findByIdAndUnidade(
                        loteId,
                        unidadeUsuario
                )
                .orElseThrow(
                        () -> new ResourceNotFoundException(
                                "Lote não encontrado na unidade do usuário."
                        )
                );
    }

    private LoteFenoRacao buscarLoteComPermissao(
            Integer loteId,
            Usuario usuario
    ) {
        if (loteId == null) {
            throw new BusinessException(
                    "O lote é obrigatório."
            );
        }

        if (
                usuario.getNivel() != null &&
                        usuario.getNivel() ==
                                NIVEL_ADMIN_MASTER
        ) {
            return loteRepository
                    .findById(
                            loteId
                    )
                    .orElseThrow(
                            () -> new ResourceNotFoundException(
                                    "Lote de feno ou ração não encontrado."
                            )
                    );
        }

        return loteRepository
                .findByIdAndUnidade(
                        loteId,
                        usuario.getUnidade().trim()
                )
                .orElseThrow(
                        () -> new ResourceNotFoundException(
                                "Lote não encontrado na unidade do usuário."
                        )
                );
    }

    private MovimentacaoFenoRacao buscarMovimentacaoPorId(
            Long movimentacaoId
    ) {
        if (movimentacaoId == null) {
            throw new BusinessException(
                    "O ID da movimentação é obrigatório."
            );
        }

        return movimentacaoRepository
                .findById(
                        movimentacaoId
                )
                .orElseThrow(
                        () -> new ResourceNotFoundException(
                                "Movimentação de feno ou ração não encontrada."
                        )
                );
    }

    /*
     * ==========================================
     * ACESSO
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
                                usuario.getStatusAcesso().trim()
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

    private boolean usuarioEhAdministrador(
            Usuario usuario
    ) {
        if (
                usuario == null ||
                        usuario.getNivel() == null
        ) {
            return false;
        }

        return usuario.getNivel() == NIVEL_ADMIN_MASTER ||
                usuario.getNivel() == NIVEL_ADMIN;
    }

    private void validarUsuarioPodeRegistrarExtravio(
            Usuario usuario
    ) {
        if (usuario.getNivel() == null) {
            throw new ForbiddenException(
                    "O usuário não possui nível de acesso cadastrado."
            );
        }

        if (
                usuario.getNivel() != NIVEL_ADMIN_MASTER &&
                        usuario.getNivel() != NIVEL_ADMIN &&
                        usuario.getNivel() != NIVEL_USUARIO_COMUM
        ) {
            throw new ForbiddenException(
                    "O usuário não possui permissão para registrar extravio."
            );
        }
    }

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
                    "Somente administradores podem realizar esta operação."
            );
        }
    }

    private void validarAcessoMovimentacao(
            MovimentacaoFenoRacao movimentacao,
            Usuario usuario
    ) {
        if (
                usuario.getNivel() != null &&
                        usuario.getNivel() ==
                                NIVEL_ADMIN_MASTER
        ) {
            return;
        }

        String unidadeUsuario =
                usuario.getUnidade().trim();

        boolean pertenceUnidade =
                unidadeUsuario.equalsIgnoreCase(
                        movimentacao.getUnidadeOrigem()
                ) ||
                        unidadeUsuario.equalsIgnoreCase(
                                movimentacao.getUnidadeDestino()
                        );

        if (!pertenceUnidade) {
            throw new ForbiddenException(
                    "O usuário não possui acesso a esta movimentação."
            );
        }
    }

    /*
     * ==========================================
     * VALIDAÇÕES
     * ==========================================
     */

    private void validarRequestSaida(
            RegistrarSaidaFenoRacaoRequestDTO request
    ) {
        if (request == null) {
            throw new BusinessException(
                    "Os dados da saída são obrigatórios."
            );
        }

        if (request.loteId() == null) {
            throw new BusinessException(
                    "O lote é obrigatório."
            );
        }

        normalizarQuantidadeKg(
                request.quantidadeNecessariaKg()
        );

        if (request.dataSaida() == null) {
            throw new BusinessException(
                    "A data da saída é obrigatória."
            );
        }
    }

    private void validarRequestExtravio(
            RegistrarExtravioFenoRacaoRequestDTO request
    ) {
        if (request == null) {
            throw new BusinessException(
                    "Os dados do extravio são obrigatórios."
            );
        }

        if (
                request.quantidadeExtraviada() == null ||
                        request.quantidadeExtraviada() <= 0
        ) {
            throw new BusinessException(
                    "A quantidade extraviada deve ser maior que zero."
            );
        }

        if (request.dataExtravio() == null) {
            throw new BusinessException(
                    "A data do extravio é obrigatória."
            );
        }
    }

    private void validarRequestCancelamento(
            CancelarMovimentacaoFenoRacaoRequestDTO request
    ) {
        if (request == null) {
            throw new BusinessException(
                    "Os dados do cancelamento são obrigatórios."
            );
        }

        normalizarTextoObrigatorio(
                request.motivo(),
                "O motivo do cancelamento é obrigatório."
        );
    }

    private void validarLoteDisponivel(
            LoteFenoRacao lote
    ) {
        if (
                lote.getSituacao() !=
                        SituacaoLoteFenoRacao.ATIVO
        ) {
            throw new ConflictException(
                    "O lote não está disponível para movimentação."
            );
        }

        if (
                lote.getQuantidadeAtual() == null ||
                        lote.getQuantidadeAtual() <= 0
        ) {
            throw new ConflictException(
                    "O lote não possui saldo disponível."
            );
        }

        if (
                lote.getValidade() != null &&
                        lote.getValidade()
                                .isBefore(
                                        LocalDate.now()
                                )
        ) {
            lote.setSituacao(
                    SituacaoLoteFenoRacao.VENCIDO
            );

            loteRepository.save(
                    lote
            );

            throw new ConflictException(
                    "O lote está vencido e não pode ser movimentado."
            );
        }
    }

    private void validarSaldoDisponivel(
            LoteFenoRacao lote,
            Integer quantidade
    ) {
        if (
                quantidade >
                        lote.getQuantidadeAtual()
        ) {
            throw new ConflictException(
                    "Saldo insuficiente no lote. Disponível: " +
                            lote.getQuantidadeAtual() +
                            " " +
                            lote.getProduto()
                                    .getUnidadeControle() +
                            "."
            );
        }
    }

    private void validarDataOperacao(
            LocalDate data,
            String mensagem
    ) {
        if (
                data.isAfter(
                        LocalDate.now()
                )
        ) {
            throw new BusinessException(
                    mensagem
            );
        }
    }

    private void validarPeriodo(
            LocalDate dataInicial,
            LocalDate dataFinal
    ) {
        if (
                dataInicial == null ||
                        dataFinal == null
        ) {
            throw new BusinessException(
                    "As datas inicial e final são obrigatórias."
            );
        }

        if (
                dataFinal.isBefore(
                        dataInicial
                )
        ) {
            throw new BusinessException(
                    "A data final não pode ser anterior à data inicial."
            );
        }
    }

    private void validarMovimentacaoCancelavel(
            MovimentacaoFenoRacao movimentacao
    ) {
        if (
                movimentacao.getSituacao() ==
                        SituacaoMovimentacaoFenoRacao.CANCELADA
        ) {
            throw new ConflictException(
                    "A movimentação já está cancelada."
            );
        }

        if (
                movimentacao.getTipoMovimentacao() !=
                        TipoMovimentacaoFenoRacao.SAIDA
        ) {
            throw new ConflictException(
                    "Somente movimentações de saída podem ser canceladas por este fluxo."
            );
        }
    }

    private void validarExtravioPendenteAnalise(
            MovimentacaoFenoRacao movimentacao
    ) {
        if (
                movimentacao.getTipoMovimentacao() !=
                        TipoMovimentacaoFenoRacao.EXTRAVIO
        ) {
            throw new ConflictException(
                    "A movimentação informada não é um extravio."
            );
        }

        if (
                movimentacao.getSituacaoAnaliseExtravio() !=
                        SituacaoAnaliseExtravioFenoRacao.PENDENTE_ANALISE
        ) {
            throw new ConflictException(
                    "Este extravio já foi analisado."
            );
        }
    }

    private void validarRequestAjusteExtravio(
            AjustarExtravioFenoRacaoRequestDTO request
    ) {
        if (request == null) {
            throw new BusinessException(
                    "Os dados do ajuste são obrigatórios."
            );
        }

        if (
                request.quantidadeConfirmada() == null ||
                        request.quantidadeConfirmada() <= 0
        ) {
            throw new BusinessException(
                    "A quantidade confirmada deve ser maior que zero."
            );
        }

        normalizarTextoObrigatorio(
                request.motivo(),
                "O motivo do ajuste é obrigatório."
        );
    }

    private void validarRequestCancelamentoExtravio(
            CancelarExtravioFenoRacaoRequestDTO request
    ) {
        if (request == null) {
            throw new BusinessException(
                    "Os dados do cancelamento do extravio são obrigatórios."
            );
        }

        normalizarTextoObrigatorio(
                request.motivo(),
                "O motivo do cancelamento é obrigatório."
        );
    }

    /*
     * ==========================================
     * ESTOQUE
     * ==========================================
     */

    private void atualizarSaldoLote(
            LoteFenoRacao lote,
            int saldoPosterior,
            Usuario usuario
    ) {
        lote.setQuantidadeAtual(
                saldoPosterior
        );

        lote.setPesoTotalAtualKg(
                lote.getProduto()
                        .getPesoUnidadeKg()
                        .multiply(
                                BigDecimal.valueOf(
                                        saldoPosterior
                                )
                        )
        );

        if (saldoPosterior == 0) {
            lote.setSituacao(
                    SituacaoLoteFenoRacao.ESGOTADO
            );
        }

        lote.setUsuarioModificadorId(
                usuario.getId()
        );

        lote.setDataModificacao(
                LocalDateTime.now()
        );

        loteRepository.save(
                lote
        );
    }

    private void restaurarSaldoLoteExtravio(
            LoteFenoRacao lote,
            int saldoPosterior,
            Usuario usuario
    ) {
        lote.setQuantidadeAtual(
                saldoPosterior
        );

        lote.setPesoTotalAtualKg(
                lote.getProduto()
                        .getPesoUnidadeKg()
                        .multiply(
                                BigDecimal.valueOf(
                                        saldoPosterior
                                )
                        )
        );

        lote.setSituacao(
                SituacaoLoteFenoRacao.ATIVO
        );

        lote.setUsuarioModificadorId(
                usuario.getId()
        );

        lote.setDataModificacao(
                LocalDateTime.now()
        );

        loteRepository.save(
                lote
        );
    }

    private MovimentacaoFenoRacao criarMovimentacaoRetornoExtravio(
            MovimentacaoFenoRacao original,
            LoteFenoRacao lote,
            TipoMovimentacaoFenoRacao tipoMovimentacao,
            int quantidadeDevolvida,
            int saldoAnterior,
            int saldoPosterior,
            String motivo,
            Usuario usuarioLogado
    ) {
        BigDecimal pesoMovimentado =
                original.getPesoUnidadeKg()
                        .multiply(
                                BigDecimal.valueOf(
                                        quantidadeDevolvida
                                )
                        );

        MovimentacaoFenoRacao retorno =
                new MovimentacaoFenoRacao();

        retorno.setProduto(
                original.getProduto()
        );

        retorno.setLote(
                lote
        );

        retorno.setTipoMovimentacao(
                tipoMovimentacao
        );

        retorno.setQuantidadeUnidades(
                quantidadeDevolvida
        );

        retorno.setPesoUnidadeKg(
                original.getPesoUnidadeKg()
        );

        retorno.setQuantidadeSolicitadaKg(
                pesoMovimentado
        );

        retorno.setPesoMovimentadoKg(
                pesoMovimentado
        );

        retorno.setSobraCalculadaKg(
                BigDecimal.ZERO
        );

        retorno.setSaldoAnterior(
                saldoAnterior
        );

        retorno.setSaldoPosterior(
                saldoPosterior
        );

        retorno.setUnidadeOrigem(
                null
        );

        retorno.setUnidadeDestino(
                lote.getUnidade()
        );

        retorno.setDataOperacao(
                LocalDate.now()
        );

        retorno.setServico(
                null
        );

        retorno.setMotivo(
                normalizarTextoObrigatorio(
                        motivo,
                        "O motivo da análise é obrigatório."
                )
        );

        retorno.setObservacao(
                null
        );

        retorno.setNumeroDocumento(
                original.getNumeroDocumento()
        );

        retorno.setResponsavel(
                original.getResponsavel()
        );

        retorno.setUsuarioId(
                usuarioLogado.getId()
        );

        retorno.setUsuarioSetor(
                normalizarTextoOpcional(
                        usuarioLogado.getSetor()
                )
        );

        retorno.setSituacao(
                SituacaoMovimentacaoFenoRacao.ATIVA
        );

        retorno.setMovimentacaoOrigem(
                original
        );

        LocalDateTime agora =
                LocalDateTime.now();

        retorno.setDataCadastro(
                agora
        );

        retorno.setUsuarioModificadorId(
                usuarioLogado.getId()
        );

        retorno.setDataModificacao(
                agora
        );

        return retorno;
    }

    /*
     * ==========================================
     * UNIDADE
     * ==========================================
     */

    private String definirUnidadeConsulta(
            String unidadeInformada,
            Usuario usuario
    ) {
        if (
                usuario.getNivel() != null &&
                        usuario.getNivel() ==
                                NIVEL_ADMIN_MASTER
        ) {
            String unidadeNormalizada =
                    normalizarTextoOpcional(
                            unidadeInformada
                    );

            if (unidadeNormalizada != null) {
                return unidadeNormalizada;
            }
        }

        return usuario.getUnidade().trim();
    }

    /*
     * ==========================================
     * NORMALIZAÇÃO
     * ==========================================
     */

    private BigDecimal normalizarQuantidadeKg(
            BigDecimal quantidade
    ) {
        if (
                quantidade == null ||
                        quantidade.compareTo(
                                BigDecimal.ZERO
                        ) <= 0
        ) {
            throw new BusinessException(
                    "A quantidade necessária deve ser maior que zero."
            );
        }

        return quantidade.stripTrailingZeros();
    }

    private String normalizarTextoObrigatorio(
            String valor,
            String mensagem
    ) {
        if (
                valor == null ||
                        valor.isBlank()
        ) {
            throw new BusinessException(
                    mensagem
            );
        }

        return valor.trim();
    }

    private String normalizarTextoOpcional(
            String valor
    ) {
        if (
                valor == null ||
                        valor.isBlank()
        ) {
            return null;
        }

        return valor.trim();
    }

    /*
     * ==========================================
     * RESPONSE
     * ==========================================
     */

    private MovimentacaoFenoRacaoResponseDTO converterParaResponse(
            MovimentacaoFenoRacao movimentacao
    ) {
        ProdutoFenoRacao produto =
                movimentacao.getProduto();

        LoteFenoRacao lote =
                movimentacao.getLote();

        return new MovimentacaoFenoRacaoResponseDTO(
                movimentacao.getId(),
                produto.getId(),
                produto.getTipoProduto(),
                produto.getNomeProduto(),
                produto.getUnidadeControle(),
                lote.getId(),
                lote.getCodigoLote(),
                movimentacao.getTipoMovimentacao(),
                movimentacao.getQuantidadeUnidades(),
                movimentacao.getPesoUnidadeKg(),
                movimentacao.getQuantidadeSolicitadaKg(),
                movimentacao.getPesoMovimentadoKg(),
                movimentacao.getSobraCalculadaKg(),
                movimentacao.getSaldoAnterior(),
                movimentacao.getSaldoPosterior(),
                movimentacao.getUnidadeOrigem(),
                movimentacao.getUnidadeDestino(),
                movimentacao.getDataOperacao(),
                movimentacao.getServico(),
                movimentacao.getMotivo(),
                movimentacao.getObservacao(),
                movimentacao.getNumeroDocumento(),
                movimentacao.getResponsavel(),
                movimentacao.getUsuarioId(),
                movimentacao.getUsuarioSetor(),
                movimentacao.getSituacao(),
                movimentacao.getSituacaoAnaliseExtravio(),
                movimentacao.getQuantidadeConfirmada(),
                movimentacao.getQuantidadeDevolvida(),
                movimentacao.getUsuarioAnaliseId(),
                movimentacao.getDataAnalise(),
                movimentacao.getMotivoAnalise(),

                movimentacao.getMovimentacaoOrigem() == null
                        ? null
                        : movimentacao
                        .getMovimentacaoOrigem()
                        .getId(),

                movimentacao.getTransferenciaId(),
                movimentacao.getDataCadastro(),
                movimentacao.getUsuarioModificadorId(),
                movimentacao.getDataModificacao()
        );
    }
}