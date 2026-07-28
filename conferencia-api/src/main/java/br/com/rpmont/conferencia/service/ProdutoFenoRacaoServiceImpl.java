package br.com.rpmont.conferencia.service;

import br.com.rpmont.conferencia.dtos.ProdutoFenoRacaoRequestDTO;
import br.com.rpmont.conferencia.dtos.ProdutoFenoRacaoResponseDTO;
import br.com.rpmont.conferencia.enums.SituacaoProdutoFenoRacao;
import br.com.rpmont.conferencia.enums.TipoProdutoFenoRacao;
import br.com.rpmont.conferencia.enums.UnidadeControleFenoRacao;
import br.com.rpmont.conferencia.exception.BusinessException;
import br.com.rpmont.conferencia.exception.ConflictException;
import br.com.rpmont.conferencia.exception.ForbiddenException;
import br.com.rpmont.conferencia.exception.ResourceNotFoundException;
import br.com.rpmont.conferencia.model.ProdutoFenoRacao;
import br.com.rpmont.conferencia.model.Usuario;
import br.com.rpmont.conferencia.repository.LoteFenoRacaoRepository;
import br.com.rpmont.conferencia.repository.ProdutoFenoRacaoRepository;
import br.com.rpmont.conferencia.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProdutoFenoRacaoServiceImpl
        implements ProdutoFenoRacaoService {

    private static final int NIVEL_ADMIN_MASTER = 1;

    private static final int NIVEL_ADMIN = 2;

    private static final String STATUS_LIBERADO = "LIBERADO";

    private final ProdutoFenoRacaoRepository produtoRepository;

    private final LoteFenoRacaoRepository loteRepository;

    private final UsuarioRepository usuarioRepository;

    /*
     * ==========================================
     * CADASTRAR
     * ==========================================
     */

    @Override
    @Transactional
    public ProdutoFenoRacaoResponseDTO cadastrar(
            ProdutoFenoRacaoRequestDTO request,
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

        validarRequest(
                request
        );

        validarProdutoEUnidadeControle(
                request.tipoProduto(),
                request.unidadeControle()
        );

        BigDecimal pesoUnidadeKg =
                normalizarPeso(
                        request.pesoUnidadeKg()
                );

        boolean produtoJaExiste =
                produtoRepository
                        .existsByTipoProdutoAndPesoUnidadeKg(
                                request.tipoProduto(),
                                pesoUnidadeKg
                        );

        if (produtoJaExiste) {
            throw new ConflictException(
                    "Já existe um produto cadastrado com esse tipo e peso por unidade."
            );
        }

        LocalDateTime dataAtual =
                LocalDateTime.now();

        ProdutoFenoRacao produto =
                new ProdutoFenoRacao();

        produto.setTipoProduto(
                request.tipoProduto()
        );

        produto.setNomeProduto(
                normalizarTextoObrigatorio(
                        request.nomeProduto(),
                        "O nome do produto é obrigatório."
                )
        );

        produto.setUnidadeControle(
                request.unidadeControle()
        );

        produto.setPesoUnidadeKg(
                pesoUnidadeKg
        );

        produto.setDescricao(
                normalizarTextoOpcional(
                        request.descricao()
                )
        );

        produto.setSituacao(
                SituacaoProdutoFenoRacao.ATIVO
        );

        produto.setUsuarioCadastroId(
                usuarioLogado.getId()
        );

        produto.setDataCadastro(
                dataAtual
        );

        produto.setUsuarioModificadorId(
                usuarioLogado.getId()
        );

        produto.setDataModificacao(
                dataAtual
        );

        ProdutoFenoRacao salvo =
                produtoRepository.save(
                        produto
                );

        return converterParaResponse(
                salvo
        );
    }

    /*
     * ==========================================
     * LISTAR PRODUTOS ATIVOS
     * ==========================================
     */

    @Override
    @Transactional(readOnly = true)
    public List<ProdutoFenoRacaoResponseDTO> listarAtivos(
            TipoProdutoFenoRacao tipoProduto,
            String matriculaUsuario
    ) {
        Usuario usuarioLogado =
                buscarUsuarioAutenticado(
                        matriculaUsuario
                );

        validarAcessoAoModulo(
                usuarioLogado
        );

        List<ProdutoFenoRacao> produtos;

        if (tipoProduto == null) {
            produtos =
                    produtoRepository
                            .findBySituacaoOrderByTipoProdutoAscPesoUnidadeKgAsc(
                                    SituacaoProdutoFenoRacao.ATIVO
                            );
        } else {
            produtos =
                    produtoRepository
                            .findByTipoProdutoAndSituacaoOrderByPesoUnidadeKgAsc(
                                    tipoProduto,
                                    SituacaoProdutoFenoRacao.ATIVO
                            );
        }

        return produtos
                .stream()
                .map(
                        this::converterParaResponse
                )
                .toList();
    }

    /*
     * ==========================================
     * BUSCAR POR ID
     * ==========================================
     */

    @Override
    @Transactional(readOnly = true)
    public ProdutoFenoRacaoResponseDTO buscarPorId(
            Integer produtoId,
            String matriculaUsuario
    ) {
        Usuario usuarioLogado =
                buscarUsuarioAutenticado(
                        matriculaUsuario
                );

        validarAcessoAoModulo(
                usuarioLogado
        );

        ProdutoFenoRacao produto =
                buscarProdutoPorId(
                        produtoId
                );

        /*
         * Usuário comum não deve visualizar diretamente
         * um produto administrativo que esteja inativo.
         */
        if (
                produto.getSituacao() ==
                        SituacaoProdutoFenoRacao.INATIVO &&
                        !usuarioEhAdministrador(
                                usuarioLogado
                        )
        ) {
            throw new ResourceNotFoundException(
                    "Produto de feno ou ração não encontrado."
            );
        }

        return converterParaResponse(
                produto
        );
    }

    /*
     * ==========================================
     * ATUALIZAR
     * ==========================================
     */

    @Override
    @Transactional
    public ProdutoFenoRacaoResponseDTO atualizar(
            Integer produtoId,
            ProdutoFenoRacaoRequestDTO request,
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

        validarRequest(
                request
        );

        ProdutoFenoRacao produto =
                buscarProdutoPorId(
                        produtoId
                );

        validarProdutoAtivo(
                produto
        );

        validarProdutoEUnidadeControle(
                request.tipoProduto(),
                request.unidadeControle()
        );

        BigDecimal pesoUnidadeKg =
                normalizarPeso(
                        request.pesoUnidadeKg()
                );

        validarAlteracaoEstruturalDoProduto(
                produto,
                request,
                pesoUnidadeKg
        );

        produtoRepository
                .findByTipoProdutoAndPesoUnidadeKg(
                        request.tipoProduto(),
                        pesoUnidadeKg
                )
                .filter(
                        produtoEncontrado ->
                                !produtoEncontrado
                                        .getId()
                                        .equals(
                                                produtoId
                                        )
                )
                .ifPresent(
                        produtoEncontrado -> {
                            throw new ConflictException(
                                    "Já existe outro produto cadastrado com esse tipo e peso por unidade."
                            );
                        }
                );

        produto.setTipoProduto(
                request.tipoProduto()
        );

        produto.setNomeProduto(
                normalizarTextoObrigatorio(
                        request.nomeProduto(),
                        "O nome do produto é obrigatório."
                )
        );

        produto.setUnidadeControle(
                request.unidadeControle()
        );

        produto.setPesoUnidadeKg(
                pesoUnidadeKg
        );

        produto.setDescricao(
                normalizarTextoOpcional(
                        request.descricao()
                )
        );

        produto.setUsuarioModificadorId(
                usuarioLogado.getId()
        );

        produto.setDataModificacao(
                LocalDateTime.now()
        );

        ProdutoFenoRacao atualizado =
                produtoRepository.save(
                        produto
                );

        return converterParaResponse(
                atualizado
        );
    }

    /*
     * ==========================================
     * INATIVAR
     * ==========================================
     */

    @Override
    @Transactional
    public ProdutoFenoRacaoResponseDTO inativar(
            Integer produtoId,
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

        ProdutoFenoRacao produto =
                buscarProdutoPorId(
                        produtoId
                );

        if (produto.getSituacao() == null) {
            throw new ConflictException(
                    "O produto não possui uma situação válida cadastrada."
            );
        }

        if (
                produto.getSituacao() ==
                        SituacaoProdutoFenoRacao.INATIVO
        ) {
            throw new ConflictException(
                    "O produto já está inativo."
            );
        }

        boolean possuiLoteComSaldo =
                loteRepository
                        .existsByProdutoIdAndQuantidadeAtualGreaterThan(
                                produtoId,
                                0
                        );

        if (possuiLoteComSaldo) {
            throw new ConflictException(
                    "Não é possível inativar o produto porque existem lotes com saldo disponível."
            );
        }

        produto.setSituacao(
                SituacaoProdutoFenoRacao.INATIVO
        );

        produto.setUsuarioModificadorId(
                usuarioLogado.getId()
        );

        produto.setDataModificacao(
                LocalDateTime.now()
        );

        ProdutoFenoRacao atualizado =
                produtoRepository.save(
                        produto
                );

        return converterParaResponse(
                atualizado
        );
    }

    /*
     * ==========================================
     * REATIVAR
     * ==========================================
     */

    @Override
    @Transactional
    public ProdutoFenoRacaoResponseDTO reativar(
            Integer produtoId,
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

        ProdutoFenoRacao produto =
                buscarProdutoPorId(
                        produtoId
                );

        if (produto.getSituacao() == null) {
            throw new ConflictException(
                    "O produto não possui uma situação válida cadastrada."
            );
        }

        if (
                produto.getSituacao() ==
                        SituacaoProdutoFenoRacao.ATIVO
        ) {
            throw new ConflictException(
                    "O produto já está ativo."
            );
        }

        produto.setSituacao(
                SituacaoProdutoFenoRacao.ATIVO
        );

        produto.setUsuarioModificadorId(
                usuarioLogado.getId()
        );

        produto.setDataModificacao(
                LocalDateTime.now()
        );

        ProdutoFenoRacao atualizado =
                produtoRepository.save(
                        produto
                );

        return converterParaResponse(
                atualizado
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
            throw new ForbiddenException(
                    "Usuário autenticado não identificado."
            );
        }

        String matriculaFormatada =
                matriculaUsuario.trim();

        return usuarioRepository
                .findByMatricula(
                        matriculaFormatada
                )
                .orElseThrow(
                        () -> new ForbiddenException(
                                "O usuário autenticado não está disponível no sistema."
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
        if (usuario.getNivel() == null) {
            throw new ForbiddenException(
                    "O usuário não possui nível de acesso cadastrado."
            );
        }

        if (
                !usuarioEhAdministrador(
                        usuario
                )
        ) {
            throw new ForbiddenException(
                    "Somente administradores podem gerenciar os produtos de feno e ração."
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

        int nivelUsuario =
                usuario.getNivel();

        return nivelUsuario == NIVEL_ADMIN_MASTER ||
                nivelUsuario == NIVEL_ADMIN;
    }

    /*
     * ==========================================
     * VALIDAÇÕES DO PRODUTO
     * ==========================================
     */

    private void validarRequest(
            ProdutoFenoRacaoRequestDTO request
    ) {
        if (request == null) {
            throw new BusinessException(
                    "Os dados do produto são obrigatórios."
            );
        }

        if (request.tipoProduto() == null) {
            throw new BusinessException(
                    "O tipo do produto é obrigatório."
            );
        }

        if (request.unidadeControle() == null) {
            throw new BusinessException(
                    "A unidade de controle é obrigatória."
            );
        }
    }

    private void validarProdutoEUnidadeControle(
            TipoProdutoFenoRacao tipoProduto,
            UnidadeControleFenoRacao unidadeControle
    ) {
        if (tipoProduto == null) {
            throw new BusinessException(
                    "O tipo do produto é obrigatório."
            );
        }

        if (unidadeControle == null) {
            throw new BusinessException(
                    "A unidade de controle é obrigatória."
            );
        }

        if (
                tipoProduto ==
                        TipoProdutoFenoRacao.FENO &&
                        unidadeControle !=
                                UnidadeControleFenoRacao.FARDO
        ) {
            throw new BusinessException(
                    "O feno deve utilizar FARDO como unidade de controle."
            );
        }

        if (
                tipoProduto !=
                        TipoProdutoFenoRacao.FENO &&
                        unidadeControle !=
                                UnidadeControleFenoRacao.SACO
        ) {
            throw new BusinessException(
                    "A ração deve utilizar SACO como unidade de controle."
            );
        }
    }

    private void validarProdutoAtivo(
            ProdutoFenoRacao produto
    ) {
        if (produto.getSituacao() == null) {
            throw new ConflictException(
                    "O produto não possui uma situação válida cadastrada."
            );
        }

        if (
                produto.getSituacao() !=
                        SituacaoProdutoFenoRacao.ATIVO
        ) {
            throw new ConflictException(
                    "Não é possível alterar um produto inativo."
            );
        }
    }

    /*
     * Impede a alteração do tipo, da unidade de controle
     * ou do peso quando o produto já possui lote vinculado.
     *
     * Nome e descrição continuam podendo ser alterados.
     */
    private void validarAlteracaoEstruturalDoProduto(
            ProdutoFenoRacao produto,
            ProdutoFenoRacaoRequestDTO request,
            BigDecimal pesoUnidadeKg
    ) {
        boolean alterouTipo =
                produto.getTipoProduto() !=
                        request.tipoProduto();

        boolean alterouUnidadeControle =
                produto.getUnidadeControle() !=
                        request.unidadeControle();

        boolean alterouPeso =
                produto.getPesoUnidadeKg() == null ||
                        produto.getPesoUnidadeKg()
                                .compareTo(
                                        pesoUnidadeKg
                                ) != 0;

        boolean alterouDadosEstruturais =
                alterouTipo ||
                        alterouUnidadeControle ||
                        alterouPeso;

        if (!alterouDadosEstruturais) {
            return;
        }

        boolean possuiLoteVinculado =
                loteRepository
                        .existsByProdutoId(
                                produto.getId()
                        );

        if (possuiLoteVinculado) {
            throw new ConflictException(
                    "Não é possível alterar o tipo, a unidade de controle ou o peso de um produto que já possui lotes vinculados."
            );
        }
    }

    private ProdutoFenoRacao buscarProdutoPorId(
            Integer produtoId
    ) {
        if (
                produtoId == null ||
                        produtoId <= 0
        ) {
            throw new BusinessException(
                    "O ID do produto deve ser maior que zero."
            );
        }

        return produtoRepository
                .findById(
                        produtoId
                )
                .orElseThrow(
                        () -> new ResourceNotFoundException(
                                "Produto de feno ou ração não encontrado."
                        )
                );
    }

    /*
     * ==========================================
     * NORMALIZAÇÃO
     * ==========================================
     */

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
                    2,
                    java.math.RoundingMode.UNNECESSARY
            );
        } catch (ArithmeticException exception) {
            throw new BusinessException(
                    "O peso por unidade deve possuir no máximo duas casas decimais."
            );
        }
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
     * CONVERSÃO PARA RESPONSE
     * ==========================================
     */

    private ProdutoFenoRacaoResponseDTO converterParaResponse(
            ProdutoFenoRacao produto
    ) {
        return new ProdutoFenoRacaoResponseDTO(
                produto.getId(),
                produto.getTipoProduto(),
                produto.getNomeProduto(),
                produto.getUnidadeControle(),
                produto.getPesoUnidadeKg(),
                produto.getDescricao(),
                produto.getSituacao(),
                produto.getUsuarioCadastroId(),
                produto.getDataCadastro(),
                produto.getUsuarioModificadorId(),
                produto.getDataModificacao()
        );
    }
}