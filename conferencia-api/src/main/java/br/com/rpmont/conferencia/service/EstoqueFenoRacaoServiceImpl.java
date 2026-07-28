package br.com.rpmont.conferencia.service;

import br.com.rpmont.conferencia.dtos.CadastrarEntradaFenoRacaoRequestDTO;
import br.com.rpmont.conferencia.dtos.EntradaFenoRacaoResponseDTO;
import br.com.rpmont.conferencia.dtos.LoteFenoRacaoResponseDTO;
import br.com.rpmont.conferencia.enums.SituacaoLoteFenoRacao;
import br.com.rpmont.conferencia.enums.SituacaoMovimentacaoFenoRacao;
import br.com.rpmont.conferencia.enums.SituacaoProdutoFenoRacao;
import br.com.rpmont.conferencia.enums.TipoMovimentacaoFenoRacao;
import br.com.rpmont.conferencia.enums.TipoProdutoFenoRacao;
import br.com.rpmont.conferencia.exception.BusinessException;
import br.com.rpmont.conferencia.exception.ConflictException;
import br.com.rpmont.conferencia.exception.ForbiddenException;
import br.com.rpmont.conferencia.exception.ResourceNotFoundException;
import br.com.rpmont.conferencia.model.LoteFenoRacao;
import br.com.rpmont.conferencia.model.MovimentacaoFenoRacao;
import br.com.rpmont.conferencia.model.ProdutoFenoRacao;
import br.com.rpmont.conferencia.model.Usuario;
import br.com.rpmont.conferencia.repository.LoteFenoRacaoRepository;
import br.com.rpmont.conferencia.repository.MovimentacaoFenoRacaoRepository;
import br.com.rpmont.conferencia.repository.ProdutoFenoRacaoRepository;
import br.com.rpmont.conferencia.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EstoqueFenoRacaoServiceImpl
        implements EstoqueFenoRacaoService {

    private static final int NIVEL_ADMIN_MASTER = 1;

    private static final int NIVEL_ADMIN = 2;

    private static final String STATUS_LIBERADO =
            "LIBERADO";

    private static final int ESCALA_PESO = 2;

    private final ProdutoFenoRacaoRepository produtoRepository;

    private final LoteFenoRacaoRepository loteRepository;

    private final MovimentacaoFenoRacaoRepository movimentacaoRepository;

    private final UsuarioRepository usuarioRepository;

    /*
     * ==========================================
     * CADASTRAR ENTRADA
     * ==========================================
     */

    @Override
    @Transactional
    public EntradaFenoRacaoResponseDTO cadastrarEntrada(
            CadastrarEntradaFenoRacaoRequestDTO request,
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

        validarRequestEntrada(
                request
        );

        validarDatas(
                request.dataEntrada(),
                request.validade()
        );

        BigDecimal pesoUnidadeKg =
                normalizarPeso(
                        request.pesoUnidadeKg()
                );

        ProdutoFenoRacao produto =
                buscarProduto(
                        request.tipoProduto(),
                        pesoUnidadeKg
                );

        validarProdutoAtivo(
                produto
        );

        String unidadeEntrada =
                definirUnidadeOperacao(
                        request.unidade(),
                        usuarioLogado
                );

        String codigoLote =
                normalizarTextoOpcional(
                        request.codigoLote()
                );

        validarDuplicidadeLote(
                codigoLote,
                produto.getId(),
                unidadeEntrada
        );

        Integer quantidadeInicial =
                request.quantidadeInicial();

        BigDecimal pesoTotal =
                calcularPesoTotal(
                        produto.getPesoUnidadeKg(),
                        quantidadeInicial
                );

        LocalDateTime dataAtual =
                LocalDateTime.now();

        LoteFenoRacao lote =
                new LoteFenoRacao();

        lote.setProduto(
                produto
        );

        lote.setCodigoLote(
                codigoLote
        );

        lote.setQuantidadeInicial(
                quantidadeInicial
        );

        lote.setQuantidadeAtual(
                quantidadeInicial
        );

        lote.setPesoTotalInicialKg(
                pesoTotal
        );

        lote.setPesoTotalAtualKg(
                pesoTotal
        );

        lote.setDataEntrada(
                request.dataEntrada()
        );

        lote.setValidade(
                request.validade()
        );

        lote.setFornecedor(
                normalizarTextoOpcional(
                        request.fornecedor()
                )
        );

        lote.setNumeroDocumento(
                normalizarTextoOpcional(
                        request.numeroDocumento()
                )
        );

        lote.setResponsavelRecebimento(
                normalizarTextoObrigatorio(
                        request.responsavelRecebimento(),
                        "O responsável pelo recebimento é obrigatório."
                )
        );

        lote.setObservacao(
                normalizarTextoOpcional(
                        request.observacao()
                )
        );

        lote.setUnidade(
                unidadeEntrada
        );

        lote.setSituacao(
                SituacaoLoteFenoRacao.ATIVO
        );

        lote.setUsuarioCadastroId(
                usuarioLogado.getId()
        );

        lote.setDataCadastro(
                dataAtual
        );

        lote.setUsuarioModificadorId(
                usuarioLogado.getId()
        );

        lote.setDataModificacao(
                dataAtual
        );

        LoteFenoRacao loteSalvo =
                loteRepository.save(
                        lote
                );

        MovimentacaoFenoRacao movimentacao =
                criarMovimentacaoEntrada(
                        loteSalvo,
                        produto,
                        usuarioLogado,
                        dataAtual
                );

        movimentacaoRepository.save(
                movimentacao
        );

        return converterParaEntradaResponse(
                loteSalvo
        );
    }

    /*
     * ==========================================
     * LISTAR ESTOQUE
     * ==========================================
     */

    @Override
    @Transactional(readOnly = true)
    public List<LoteFenoRacaoResponseDTO> listarEstoque(
            TipoProdutoFenoRacao tipoProduto,
            BigDecimal pesoUnidadeKg,
            SituacaoLoteFenoRacao situacao,
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

        String unidadeConsulta =
                definirUnidadeConsulta(
                        unidade,
                        usuarioLogado
                );

        BigDecimal pesoNormalizado =
                pesoUnidadeKg == null
                        ? null
                        : normalizarPeso(
                        pesoUnidadeKg
                );

        return loteRepository
                .findByUnidadeOrderByDataEntradaDesc(
                        unidadeConsulta
                )
                .stream()
                .filter(
                        lote ->
                                tipoProduto == null ||
                                        lote.getProduto()
                                                .getTipoProduto() ==
                                                tipoProduto
                )
                .filter(
                        lote ->
                                pesoNormalizado == null ||
                                        lote.getProduto()
                                                .getPesoUnidadeKg()
                                                .compareTo(
                                                        pesoNormalizado
                                                ) == 0
                )
                .filter(
                        lote ->
                                situacao == null ||
                                        lote.getSituacao() ==
                                                situacao
                )
                .map(
                        this::converterParaLoteResponse
                )
                .toList();
    }

    /*
     * ==========================================
     * BUSCAR LOTE POR ID
     * ==========================================
     */

    @Override
    @Transactional(readOnly = true)
    public LoteFenoRacaoResponseDTO buscarLotePorId(
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

        LoteFenoRacao lote =
                buscarLoteComPermissao(
                        loteId,
                        usuarioLogado
                );

        return converterParaLoteResponse(
                lote
        );
    }

    /*
     * ==========================================
     * LISTAR LOTES DISPONÍVEIS
     * ==========================================
     */

    @Override
    @Transactional(readOnly = true)
    public List<LoteFenoRacaoResponseDTO> listarLotesDisponiveis(
            TipoProdutoFenoRacao tipoProduto,
            BigDecimal pesoUnidadeKg,
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

        if (tipoProduto == null) {
            throw new BusinessException(
                    "O tipo do produto é obrigatório."
            );
        }

        BigDecimal pesoNormalizado =
                normalizarPeso(
                        pesoUnidadeKg
                );

        ProdutoFenoRacao produto =
                buscarProduto(
                        tipoProduto,
                        pesoNormalizado
                );

        validarProdutoAtivo(
                produto
        );

        String unidadeConsulta =
                definirUnidadeConsulta(
                        unidade,
                        usuarioLogado
                );

        return loteRepository
                .findByProdutoIdAndUnidadeAndSituacaoAndQuantidadeAtualGreaterThanOrderByDataEntradaAsc(
                        produto.getId(),
                        unidadeConsulta,
                        SituacaoLoteFenoRacao.ATIVO,
                        0
                )
                .stream()
                .filter(
                        lote ->
                                lote.getValidade() == null ||
                                        !lote.getValidade()
                                                .isBefore(
                                                        LocalDate.now()
                                                )
                )
                .sorted(
                        Comparator
                                .comparing(
                                        LoteFenoRacao::getValidade,
                                        Comparator.nullsLast(
                                                Comparator.naturalOrder()
                                        )
                                )
                                .thenComparing(
                                        LoteFenoRacao::getDataEntrada
                                )
                )
                .map(
                        this::converterParaLoteResponse
                )
                .toList();
    }

    /*
     * ==========================================
     * ATUALIZAR ENTRADA
     * ==========================================
     */

    @Override
    @Transactional
    public EntradaFenoRacaoResponseDTO atualizarEntrada(
            Integer loteId,
            CadastrarEntradaFenoRacaoRequestDTO request,
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

        validarRequestEntrada(
                request
        );

        validarDatas(
                request.dataEntrada(),
                request.validade()
        );

        LoteFenoRacao lote =
                buscarLoteComPermissao(
                        loteId,
                        usuarioLogado
                );

        validarLoteEditavel(
                lote
        );

        BigDecimal pesoUnidadeKg =
                normalizarPeso(
                        request.pesoUnidadeKg()
                );

        ProdutoFenoRacao produto =
                buscarProduto(
                        request.tipoProduto(),
                        pesoUnidadeKg
                );

        validarProdutoAtivo(
                produto
        );

        String unidadeEntrada =
                definirUnidadeOperacao(
                        request.unidade(),
                        usuarioLogado
                );

        String codigoLote =
                normalizarTextoOpcional(
                        request.codigoLote()
                );

        validarDuplicidadeNaAtualizacao(
                lote,
                codigoLote,
                produto.getId(),
                unidadeEntrada
        );

        BigDecimal pesoTotal =
                calcularPesoTotal(
                        produto.getPesoUnidadeKg(),
                        request.quantidadeInicial()
                );

        LocalDateTime dataAtual =
                LocalDateTime.now();

        lote.setProduto(
                produto
        );

        lote.setCodigoLote(
                codigoLote
        );

        lote.setQuantidadeInicial(
                request.quantidadeInicial()
        );

        lote.setQuantidadeAtual(
                request.quantidadeInicial()
        );

        lote.setPesoTotalInicialKg(
                pesoTotal
        );

        lote.setPesoTotalAtualKg(
                pesoTotal
        );

        lote.setDataEntrada(
                request.dataEntrada()
        );

        lote.setValidade(
                request.validade()
        );

        lote.setFornecedor(
                normalizarTextoOpcional(
                        request.fornecedor()
                )
        );

        lote.setNumeroDocumento(
                normalizarTextoOpcional(
                        request.numeroDocumento()
                )
        );

        lote.setResponsavelRecebimento(
                normalizarTextoObrigatorio(
                        request.responsavelRecebimento(),
                        "O responsável pelo recebimento é obrigatório."
                )
        );

        lote.setObservacao(
                normalizarTextoOpcional(
                        request.observacao()
                )
        );

        lote.setUnidade(
                unidadeEntrada
        );

        lote.setUsuarioModificadorId(
                usuarioLogado.getId()
        );

        lote.setDataModificacao(
                dataAtual
        );

        LoteFenoRacao loteAtualizado =
                loteRepository.save(
                        lote
                );

        MovimentacaoFenoRacao entradaOriginal =
                buscarMovimentacaoEntradaAtiva(
                        loteId
                );

        atualizarMovimentacaoEntrada(
                entradaOriginal,
                loteAtualizado,
                produto,
                usuarioLogado,
                dataAtual
        );

        movimentacaoRepository.save(
                entradaOriginal
        );

        return converterParaEntradaResponse(
                loteAtualizado
        );
    }

    /*
     * ==========================================
     * CANCELAR ENTRADA
     * ==========================================
     */

    @Override
    @Transactional
    public EntradaFenoRacaoResponseDTO cancelarEntrada(
            Integer loteId,
            String motivo,
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

        String motivoNormalizado =
                normalizarTextoObrigatorio(
                        motivo,
                        "O motivo do cancelamento é obrigatório."
                );

        LoteFenoRacao lote =
                buscarLoteComPermissao(
                        loteId,
                        usuarioLogado
                );

        validarLoteCancelavel(
                lote
        );

        MovimentacaoFenoRacao entradaOriginal =
                buscarMovimentacaoEntradaAtiva(
                        loteId
                );

        Integer saldoAnterior =
                lote.getQuantidadeAtual();

        BigDecimal pesoCancelado =
                normalizarValorMonetarioOuPeso(
                        lote.getPesoTotalAtualKg()
                );

        LocalDateTime dataAtual =
                LocalDateTime.now();

        lote.setQuantidadeAtual(
                0
        );

        lote.setPesoTotalAtualKg(
                zeroComEscala()
        );

        lote.setSituacao(
                SituacaoLoteFenoRacao.CANCELADO
        );

        lote.setUsuarioModificadorId(
                usuarioLogado.getId()
        );

        lote.setDataModificacao(
                dataAtual
        );

        LoteFenoRacao loteCancelado =
                loteRepository.save(
                        lote
                );

        entradaOriginal.setSituacao(
                SituacaoMovimentacaoFenoRacao.CANCELADA
        );

        entradaOriginal.setUsuarioModificadorId(
                usuarioLogado.getId()
        );

        entradaOriginal.setDataModificacao(
                dataAtual
        );

        movimentacaoRepository.save(
                entradaOriginal
        );

        MovimentacaoFenoRacao cancelamento =
                new MovimentacaoFenoRacao();

        cancelamento.setProduto(
                lote.getProduto()
        );

        cancelamento.setLote(
                lote
        );

        cancelamento.setTipoMovimentacao(
                TipoMovimentacaoFenoRacao.CANCELAMENTO_ENTRADA
        );

        cancelamento.setQuantidadeUnidades(
                saldoAnterior
        );

        cancelamento.setPesoUnidadeKg(
                normalizarValorMonetarioOuPeso(
                        lote.getProduto()
                                .getPesoUnidadeKg()
                )
        );

        cancelamento.setQuantidadeSolicitadaKg(
                pesoCancelado
        );

        cancelamento.setPesoMovimentadoKg(
                pesoCancelado
        );

        cancelamento.setSobraCalculadaKg(
                zeroComEscala()
        );

        cancelamento.setSaldoAnterior(
                saldoAnterior
        );

        cancelamento.setSaldoPosterior(
                0
        );

        cancelamento.setUnidadeOrigem(
                lote.getUnidade()
        );

        cancelamento.setUnidadeDestino(
                null
        );

        cancelamento.setDataOperacao(
                LocalDate.now()
        );

        cancelamento.setMotivo(
                limitarTexto(
                        motivoNormalizado,
                        250
                )
        );

        cancelamento.setObservacao(
                limitarTexto(
                        motivoNormalizado,
                        500
                )
        );

        cancelamento.setNumeroDocumento(
                lote.getNumeroDocumento()
        );

        cancelamento.setResponsavel(
                lote.getResponsavelRecebimento()
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
                entradaOriginal
        );

        cancelamento.setDataCadastro(
                dataAtual
        );

        cancelamento.setUsuarioModificadorId(
                usuarioLogado.getId()
        );

        cancelamento.setDataModificacao(
                dataAtual
        );

        movimentacaoRepository.save(
                cancelamento
        );

        return converterParaEntradaResponse(
                loteCancelado
        );
    }

    /*
     * ==========================================
     * CRIAÇÃO DA MOVIMENTAÇÃO DE ENTRADA
     * ==========================================
     */

    private MovimentacaoFenoRacao criarMovimentacaoEntrada(
            LoteFenoRacao lote,
            ProdutoFenoRacao produto,
            Usuario usuario,
            LocalDateTime dataAtual
    ) {
        MovimentacaoFenoRacao movimentacao =
                new MovimentacaoFenoRacao();

        movimentacao.setProduto(
                produto
        );

        movimentacao.setLote(
                lote
        );

        movimentacao.setTipoMovimentacao(
                TipoMovimentacaoFenoRacao.ENTRADA
        );

        movimentacao.setQuantidadeUnidades(
                lote.getQuantidadeInicial()
        );

        movimentacao.setPesoUnidadeKg(
                normalizarValorMonetarioOuPeso(
                        produto.getPesoUnidadeKg()
                )
        );

        movimentacao.setQuantidadeSolicitadaKg(
                normalizarValorMonetarioOuPeso(
                        lote.getPesoTotalInicialKg()
                )
        );

        movimentacao.setPesoMovimentadoKg(
                normalizarValorMonetarioOuPeso(
                        lote.getPesoTotalInicialKg()
                )
        );

        movimentacao.setSobraCalculadaKg(
                zeroComEscala()
        );

        movimentacao.setSaldoAnterior(
                0
        );

        movimentacao.setSaldoPosterior(
                lote.getQuantidadeInicial()
        );

        movimentacao.setUnidadeOrigem(
                null
        );

        movimentacao.setUnidadeDestino(
                lote.getUnidade()
        );

        movimentacao.setDataOperacao(
                lote.getDataEntrada()
        );

        movimentacao.setObservacao(
                lote.getObservacao()
        );

        movimentacao.setNumeroDocumento(
                lote.getNumeroDocumento()
        );

        movimentacao.setResponsavel(
                lote.getResponsavelRecebimento()
        );

        movimentacao.setUsuarioId(
                usuario.getId()
        );

        movimentacao.setUsuarioSetor(
                normalizarTextoOpcional(
                        usuario.getSetor()
                )
        );

        movimentacao.setSituacao(
                SituacaoMovimentacaoFenoRacao.ATIVA
        );

        movimentacao.setDataCadastro(
                dataAtual
        );

        movimentacao.setUsuarioModificadorId(
                usuario.getId()
        );

        movimentacao.setDataModificacao(
                dataAtual
        );

        return movimentacao;
    }

    /*
     * ==========================================
     * ATUALIZAÇÃO DA MOVIMENTAÇÃO DE ENTRADA
     * ==========================================
     */

    private void atualizarMovimentacaoEntrada(
            MovimentacaoFenoRacao movimentacao,
            LoteFenoRacao lote,
            ProdutoFenoRacao produto,
            Usuario usuario,
            LocalDateTime dataAtual
    ) {
        movimentacao.setProduto(
                produto
        );

        movimentacao.setLote(
                lote
        );

        movimentacao.setQuantidadeUnidades(
                lote.getQuantidadeInicial()
        );

        movimentacao.setPesoUnidadeKg(
                normalizarValorMonetarioOuPeso(
                        produto.getPesoUnidadeKg()
                )
        );

        movimentacao.setQuantidadeSolicitadaKg(
                normalizarValorMonetarioOuPeso(
                        lote.getPesoTotalInicialKg()
                )
        );

        movimentacao.setPesoMovimentadoKg(
                normalizarValorMonetarioOuPeso(
                        lote.getPesoTotalInicialKg()
                )
        );

        movimentacao.setSobraCalculadaKg(
                zeroComEscala()
        );

        movimentacao.setSaldoAnterior(
                0
        );

        movimentacao.setSaldoPosterior(
                lote.getQuantidadeInicial()
        );

        movimentacao.setUnidadeOrigem(
                null
        );

        movimentacao.setUnidadeDestino(
                lote.getUnidade()
        );

        movimentacao.setDataOperacao(
                lote.getDataEntrada()
        );

        movimentacao.setObservacao(
                lote.getObservacao()
        );

        movimentacao.setNumeroDocumento(
                lote.getNumeroDocumento()
        );

        movimentacao.setResponsavel(
                lote.getResponsavelRecebimento()
        );

        movimentacao.setUsuarioModificadorId(
                usuario.getId()
        );

        movimentacao.setDataModificacao(
                dataAtual
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
            throw new ForbiddenException(
                    "Usuário autenticado não identificado."
            );
        }

        String matriculaNormalizada =
                matriculaUsuario.trim();

        return usuarioRepository
                .findByMatricula(
                        matriculaNormalizada
                )
                .orElseThrow(
                        () -> new ForbiddenException(
                                "O usuário autenticado não está disponível no sistema."
                        )
                );
    }

    private ProdutoFenoRacao buscarProduto(
            TipoProdutoFenoRacao tipoProduto,
            BigDecimal pesoUnidadeKg
    ) {
        if (tipoProduto == null) {
            throw new BusinessException(
                    "O tipo do produto é obrigatório."
            );
        }

        if (pesoUnidadeKg == null) {
            throw new BusinessException(
                    "O peso por unidade é obrigatório."
            );
        }

        return produtoRepository
                .findByTipoProdutoAndPesoUnidadeKg(
                        tipoProduto,
                        pesoUnidadeKg
                )
                .orElseThrow(
                        () -> new ResourceNotFoundException(
                                "Produto de feno ou ração não encontrado para o tipo e peso informados."
                        )
                );
    }

    private LoteFenoRacao buscarLoteComPermissao(
            Integer loteId,
            Usuario usuario
    ) {
        validarIdLote(
                loteId
        );

        if (usuarioEhAdminMaster(usuario)) {
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

    private MovimentacaoFenoRacao buscarMovimentacaoEntradaAtiva(
            Integer loteId
    ) {
        validarIdLote(
                loteId
        );

        return movimentacaoRepository
                .findByLoteIdOrderByDataOperacaoDescDataCadastroDesc(
                        loteId
                )
                .stream()
                .filter(
                        movimentacao ->
                                movimentacao.getTipoMovimentacao() ==
                                        TipoMovimentacaoFenoRacao.ENTRADA
                )
                .filter(
                        movimentacao ->
                                movimentacao.getSituacao() ==
                                        SituacaoMovimentacaoFenoRacao.ATIVA
                )
                .findFirst()
                .orElseThrow(
                        () -> new ResourceNotFoundException(
                                "A movimentação original de entrada não foi encontrada."
                        )
                );
    }

    /*
     * ==========================================
     * VALIDAÇÕES DE ACESSO
     * ==========================================
     */

    private void validarAcessoAoModulo(
            Usuario usuario
    ) {
        if (usuario == null) {
            throw new ForbiddenException(
                    "Usuário autenticado não identificado."
            );
        }

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

    private void validarUsuarioAdministrador(
            Usuario usuario
    ) {
        if (
                usuario == null ||
                        usuario.getNivel() == null
        ) {
            throw new ForbiddenException(
                    "O usuário não possui nível de acesso cadastrado."
            );
        }

        if (
                usuario.getNivel() != NIVEL_ADMIN_MASTER &&
                        usuario.getNivel() != NIVEL_ADMIN
        ) {
            throw new ForbiddenException(
                    "Somente administradores podem gerenciar entradas de feno e ração."
            );
        }
    }

    private boolean usuarioEhAdminMaster(
            Usuario usuario
    ) {
        return usuario != null &&
                usuario.getNivel() != null &&
                usuario.getNivel() == NIVEL_ADMIN_MASTER;
    }

    /*
     * ==========================================
     * VALIDAÇÕES DE NEGÓCIO
     * ==========================================
     */

    private void validarRequestEntrada(
            CadastrarEntradaFenoRacaoRequestDTO request
    ) {
        if (request == null) {
            throw new BusinessException(
                    "Os dados da entrada são obrigatórios."
            );
        }

        if (request.tipoProduto() == null) {
            throw new BusinessException(
                    "O tipo do produto é obrigatório."
            );
        }

        if (
                request.pesoUnidadeKg() == null ||
                        request.pesoUnidadeKg()
                                .compareTo(
                                        BigDecimal.ZERO
                                ) <= 0
        ) {
            throw new BusinessException(
                    "O peso por unidade deve ser maior que zero."
            );
        }

        if (
                request.quantidadeInicial() == null ||
                        request.quantidadeInicial() <= 0
        ) {
            throw new BusinessException(
                    "A quantidade de entrada deve ser maior que zero."
            );
        }

        if (request.dataEntrada() == null) {
            throw new BusinessException(
                    "A data da entrada é obrigatória."
            );
        }

        normalizarTextoObrigatorio(
                request.responsavelRecebimento(),
                "O responsável pelo recebimento é obrigatório."
        );
    }

    private void validarDatas(
            LocalDate dataEntrada,
            LocalDate validade
    ) {
        if (dataEntrada == null) {
            throw new BusinessException(
                    "A data da entrada é obrigatória."
            );
        }

        LocalDate dataAtual =
                LocalDate.now();

        if (dataEntrada.isAfter(dataAtual)) {
            throw new BusinessException(
                    "A data da entrada não pode ser futura."
            );
        }

        if (
                validade != null &&
                        validade.isBefore(
                                dataEntrada
                        )
        ) {
            throw new BusinessException(
                    "A validade não pode ser anterior à data da entrada."
            );
        }
    }

    private void validarProdutoAtivo(
            ProdutoFenoRacao produto
    ) {
        if (
                produto == null ||
                        produto.getSituacao() == null
        ) {
            throw new ConflictException(
                    "O produto não possui uma situação válida cadastrada."
            );
        }

        if (
                produto.getSituacao() !=
                        SituacaoProdutoFenoRacao.ATIVO
        ) {
            throw new ConflictException(
                    "Não é possível operar estoque para um produto inativo."
            );
        }
    }

    private void validarDuplicidadeLote(
            String codigoLote,
            Integer produtoId,
            String unidade
    ) {
        if (codigoLote == null) {
            return;
        }

        boolean loteJaExiste =
                loteRepository
                        .existsByCodigoLoteAndProdutoIdAndUnidade(
                                codigoLote,
                                produtoId,
                                unidade
                        );

        if (loteJaExiste) {
            throw new ConflictException(
                    "Já existe um lote com esse código para o produto e a unidade informados."
            );
        }
    }

    private void validarDuplicidadeNaAtualizacao(
            LoteFenoRacao loteAtual,
            String codigoLote,
            Integer produtoId,
            String unidade
    ) {
        if (codigoLote == null) {
            return;
        }

        boolean codigoAlterado =
                loteAtual.getCodigoLote() == null ||
                        !codigoLote.equals(
                                loteAtual.getCodigoLote()
                        );

        boolean produtoAlterado =
                loteAtual.getProduto() == null ||
                        loteAtual.getProduto().getId() == null ||
                        !produtoId.equals(
                                loteAtual.getProduto().getId()
                        );

        boolean unidadeAlterada =
                loteAtual.getUnidade() == null ||
                        !unidade.equalsIgnoreCase(
                                loteAtual.getUnidade()
                        );

        boolean identificacaoAlterada =
                codigoAlterado ||
                        produtoAlterado ||
                        unidadeAlterada;

        if (
                identificacaoAlterada &&
                        loteRepository
                                .existsByCodigoLoteAndProdutoIdAndUnidade(
                                        codigoLote,
                                        produtoId,
                                        unidade
                                )
        ) {
            throw new ConflictException(
                    "Já existe outro lote com esse código para o produto e a unidade informados."
            );
        }
    }

    private void validarLoteEditavel(
            LoteFenoRacao lote
    ) {
        validarSituacaoLoteExistente(
                lote
        );

        if (
                lote.getSituacao() !=
                        SituacaoLoteFenoRacao.ATIVO
        ) {
            throw new ConflictException(
                    "Somente lotes ativos podem ter a entrada atualizada."
            );
        }

        validarQuantidadesLote(
                lote
        );

        if (
                !lote.getQuantidadeInicial()
                        .equals(
                                lote.getQuantidadeAtual()
                        )
        ) {
            throw new ConflictException(
                    "Não é possível atualizar uma entrada cujo estoque já foi movimentado."
            );
        }
    }

    private void validarLoteCancelavel(
            LoteFenoRacao lote
    ) {
        validarSituacaoLoteExistente(
                lote
        );

        if (
                lote.getSituacao() ==
                        SituacaoLoteFenoRacao.CANCELADO
        ) {
            throw new ConflictException(
                    "A entrada deste lote já foi cancelada."
            );
        }

        if (
                lote.getSituacao() !=
                        SituacaoLoteFenoRacao.ATIVO
        ) {
            throw new ConflictException(
                    "Somente lotes ativos podem ter a entrada cancelada."
            );
        }

        validarQuantidadesLote(
                lote
        );

        if (
                !lote.getQuantidadeInicial()
                        .equals(
                                lote.getQuantidadeAtual()
                        )
        ) {
            throw new ConflictException(
                    "Não é possível cancelar uma entrada cujo estoque já foi movimentado."
            );
        }
    }

    private void validarSituacaoLoteExistente(
            LoteFenoRacao lote
    ) {
        if (
                lote == null ||
                        lote.getSituacao() == null
        ) {
            throw new ConflictException(
                    "O lote não possui uma situação válida cadastrada."
            );
        }
    }

    private void validarQuantidadesLote(
            LoteFenoRacao lote
    ) {
        if (
                lote.getQuantidadeInicial() == null ||
                        lote.getQuantidadeAtual() == null
        ) {
            throw new ConflictException(
                    "O lote não possui quantidades válidas cadastradas."
            );
        }

        if (
                lote.getQuantidadeInicial() < 0 ||
                        lote.getQuantidadeAtual() < 0
        ) {
            throw new ConflictException(
                    "O lote possui quantidade inválida cadastrada."
            );
        }
    }

    private void validarIdLote(
            Integer loteId
    ) {
        if (
                loteId == null ||
                        loteId <= 0
        ) {
            throw new BusinessException(
                    "O ID do lote deve ser maior que zero."
            );
        }
    }

    /*
     * ==========================================
     * UNIDADE
     * ==========================================
     */

    private String definirUnidadeOperacao(
            String unidadeInformada,
            Usuario usuario
    ) {
        if (usuarioEhAdminMaster(usuario)) {
            String unidadeNormalizada =
                    normalizarTextoOpcional(
                            unidadeInformada
                    );

            if (unidadeNormalizada != null) {
                return unidadeNormalizada;
            }
        }

        return normalizarTextoObrigatorio(
                usuario.getUnidade(),
                "O usuário não possui unidade cadastrada."
        );
    }

    private String definirUnidadeConsulta(
            String unidadeInformada,
            Usuario usuario
    ) {
        return definirUnidadeOperacao(
                unidadeInformada,
                usuario
        );
    }

    /*
     * ==========================================
     * CÁLCULOS E NORMALIZAÇÃO
     * ==========================================
     */

    private BigDecimal calcularPesoTotal(
            BigDecimal pesoUnidadeKg,
            Integer quantidade
    ) {
        if (
                quantidade == null ||
                        quantidade <= 0
        ) {
            throw new BusinessException(
                    "A quantidade deve ser maior que zero."
            );
        }

        BigDecimal pesoNormalizado =
                normalizarPeso(
                        pesoUnidadeKg
                );

        return pesoNormalizado
                .multiply(
                        BigDecimal.valueOf(
                                quantidade
                        )
                )
                .setScale(
                        ESCALA_PESO,
                        RoundingMode.UNNECESSARY
                );
    }

    private BigDecimal normalizarPeso(
            BigDecimal pesoUnidadeKg
    ) {
        if (
                pesoUnidadeKg == null ||
                        pesoUnidadeKg.compareTo(
                                BigDecimal.ZERO
                        ) <= 0
        ) {
            throw new BusinessException(
                    "O peso por unidade deve ser maior que zero."
            );
        }

        try {
            return pesoUnidadeKg.setScale(
                    ESCALA_PESO,
                    RoundingMode.UNNECESSARY
            );
        } catch (ArithmeticException exception) {
            throw new BusinessException(
                    "O peso por unidade deve possuir no máximo duas casas decimais."
            );
        }
    }

    private BigDecimal normalizarValorMonetarioOuPeso(
            BigDecimal valor
    ) {
        if (valor == null) {
            return zeroComEscala();
        }

        try {
            return valor.setScale(
                    ESCALA_PESO,
                    RoundingMode.UNNECESSARY
            );
        } catch (ArithmeticException exception) {
            throw new ConflictException(
                    "O valor de peso armazenado possui mais de duas casas decimais."
            );
        }
    }

    private BigDecimal zeroComEscala() {
        return BigDecimal.ZERO.setScale(
                ESCALA_PESO
        );
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

    private String limitarTexto(
            String valor,
            int limite
    ) {
        if (
                valor == null ||
                        valor.length() <= limite
        ) {
            return valor;
        }

        return valor.substring(
                0,
                limite
        );
    }

    /*
     * ==========================================
     * CONVERSÃO PARA RESPONSE
     * ==========================================
     */

    private EntradaFenoRacaoResponseDTO converterParaEntradaResponse(
            LoteFenoRacao lote
    ) {
        ProdutoFenoRacao produto =
                lote.getProduto();

        return new EntradaFenoRacaoResponseDTO(
                lote.getId(),
                produto.getId(),
                produto.getTipoProduto(),
                produto.getNomeProduto(),
                produto.getUnidadeControle(),
                normalizarValorMonetarioOuPeso(
                        produto.getPesoUnidadeKg()
                ),
                lote.getCodigoLote(),
                lote.getQuantidadeInicial(),
                lote.getQuantidadeAtual(),
                normalizarValorMonetarioOuPeso(
                        lote.getPesoTotalInicialKg()
                ),
                normalizarValorMonetarioOuPeso(
                        lote.getPesoTotalAtualKg()
                ),
                lote.getDataEntrada(),
                lote.getValidade(),
                lote.getFornecedor(),
                lote.getNumeroDocumento(),
                lote.getResponsavelRecebimento(),
                lote.getObservacao(),
                lote.getUnidade(),
                lote.getSituacao(),
                lote.getUsuarioCadastroId(),
                lote.getDataCadastro(),
                lote.getUsuarioModificadorId(),
                lote.getDataModificacao()
        );
    }

    private LoteFenoRacaoResponseDTO converterParaLoteResponse(
            LoteFenoRacao lote
    ) {
        ProdutoFenoRacao produto =
                lote.getProduto();

        return new LoteFenoRacaoResponseDTO(
                lote.getId(),
                produto.getId(),
                produto.getTipoProduto(),
                produto.getNomeProduto(),
                produto.getUnidadeControle(),
                normalizarValorMonetarioOuPeso(
                        produto.getPesoUnidadeKg()
                ),
                lote.getCodigoLote(),
                lote.getQuantidadeInicial(),
                lote.getQuantidadeAtual(),
                normalizarValorMonetarioOuPeso(
                        lote.getPesoTotalInicialKg()
                ),
                normalizarValorMonetarioOuPeso(
                        lote.getPesoTotalAtualKg()
                ),
                lote.getDataEntrada(),
                lote.getValidade(),
                lote.getFornecedor(),
                lote.getNumeroDocumento(),
                lote.getTransferenciaOrigemId(),
                lote.getResponsavelRecebimento(),
                lote.getObservacao(),
                lote.getUnidade(),
                lote.getSituacao(),
                lote.getUsuarioCadastroId(),
                lote.getDataCadastro(),
                lote.getUsuarioModificadorId(),
                lote.getDataModificacao()
        );
    }
}