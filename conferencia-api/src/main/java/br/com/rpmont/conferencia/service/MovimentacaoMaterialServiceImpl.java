package br.com.rpmont.conferencia.service;

import br.com.rpmont.conferencia.dtos.MovimentacaoMaterialFiltroDTO;
import br.com.rpmont.conferencia.dtos.MovimentacaoMaterialResponseDTO;
import br.com.rpmont.conferencia.enums.NivelUsuario;
import br.com.rpmont.conferencia.enums.SituacaoMaterial;
import br.com.rpmont.conferencia.enums.TipoMovimentacaoMaterial;
import br.com.rpmont.conferencia.exception.BusinessException;
import br.com.rpmont.conferencia.exception.ForbiddenException;
import br.com.rpmont.conferencia.exception.ResourceNotFoundException;
import br.com.rpmont.conferencia.model.MaterialPatrimonial;
import br.com.rpmont.conferencia.model.MovimentacaoMaterial;
import br.com.rpmont.conferencia.model.Usuario;
import br.com.rpmont.conferencia.repository.MaterialPatrimonialRepository;
import br.com.rpmont.conferencia.repository.MovimentacaoMaterialRepository;
import br.com.rpmont.conferencia.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

import static br.com.rpmont.conferencia.specification.MovimentacaoMaterialSpecification.comFiltros;
import static br.com.rpmont.conferencia.specification.MovimentacaoMaterialSpecification.daUnidadeAtualDoMaterial;

@Service
@RequiredArgsConstructor
public class MovimentacaoMaterialServiceImpl
        implements MovimentacaoMaterialService {

    private final MovimentacaoMaterialRepository movimentacaoRepository;

    private final MaterialPatrimonialRepository materialRepository;

    private final UsuarioRepository usuarioRepository;

    /*
     * ==========================================
     * REGISTRAR TRANSFERÊNCIA ENTRE SETORES
     * ==========================================
     */

    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public void registrarTransferenciaSetor(
            MaterialPatrimonial material,
            String setorOrigem,
            String setorDestino,
            Usuario usuarioResponsavel
    ) {
        validarMaterial(
                material
        );

        validarUsuarioResponsavel(
                usuarioResponsavel
        );

        String setorOrigemTratado =
                normalizarTextoObrigatorio(
                        setorOrigem,
                        "O setor de origem é obrigatório."
                );

        String setorDestinoTratado =
                normalizarTextoObrigatorio(
                        setorDestino,
                        "O setor de destino é obrigatório."
                );

        MovimentacaoMaterial movimentacao =
                new MovimentacaoMaterial();

        movimentacao.setMaterialId(
                material.getId()
        );

        movimentacao.setTipoMovimentacao(
                TipoMovimentacaoMaterial.TRANSFERENCIA_SETOR
        );

        movimentacao.setSetorOrigem(
                setorOrigemTratado
        );

        movimentacao.setSetorDestino(
                setorDestinoTratado
        );

        movimentacao.setUnidadeOrigem(
                material.getUnidade()
        );

        movimentacao.setUnidadeDestino(
                material.getUnidade()
        );

        movimentacao.setSituacaoAnterior(
                material.getSituacao()
        );

        movimentacao.setSituacaoNova(
                material.getSituacao()
        );

        movimentacao.setMotivo(
                "Material localizado e transferido durante a conferência patrimonial."
        );

        movimentacao.setObservacao(
                "Transferência automática entre setores realizada durante a leitura do material."
        );

        movimentacao.setNumeroDocumento(
                null
        );

        movimentacao.setUsuarioId(
                usuarioResponsavel.getId()
        );

        movimentacaoRepository.save(
                movimentacao
        );
    }

    /*
     * ==========================================
     * REGISTRAR BAIXA PATRIMONIAL
     * ==========================================
     */

    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public void registrarBaixa(
            MaterialPatrimonial material,
            SituacaoMaterial situacaoAnterior,
            String motivo,
            String numeroDocumento,
            String observacao,
            Usuario usuarioResponsavel
    ) {
        validarMaterial(
                material
        );

        validarUsuarioResponsavel(
                usuarioResponsavel
        );

        validarSituacaoAnterior(
                situacaoAnterior
        );

        String motivoTratado =
                normalizarTextoObrigatorio(
                        motivo,
                        "O motivo da baixa é obrigatório."
                );

        String documentoTratado =
                normalizarTextoObrigatorio(
                        numeroDocumento,
                        "O número do documento da baixa é obrigatório."
                );

        MovimentacaoMaterial movimentacao =
                criarMovimentacaoDeSituacao(
                        material,
                        TipoMovimentacaoMaterial.BAIXA,
                        situacaoAnterior,
                        SituacaoMaterial.BAIXADO,
                        motivoTratado,
                        documentoTratado,
                        observacao,
                        usuarioResponsavel
                );

        movimentacaoRepository.save(
                movimentacao
        );
    }

    /*
     * ==========================================
     * REGISTRAR DESCARTE PATRIMONIAL
     * ==========================================
     */

    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public void registrarDescarte(
            MaterialPatrimonial material,
            SituacaoMaterial situacaoAnterior,
            String motivo,
            String numeroDocumento,
            String observacao,
            Usuario usuarioResponsavel
    ) {
        validarMaterial(
                material
        );

        validarUsuarioResponsavel(
                usuarioResponsavel
        );

        validarSituacaoAnterior(
                situacaoAnterior
        );

        if (situacaoAnterior != SituacaoMaterial.BAIXADO) {
            throw new BusinessException(
                    "A situação anterior do descarte deve ser BAIXADO."
            );
        }

        String motivoTratado =
                normalizarTextoObrigatorio(
                        motivo,
                        "O motivo do descarte é obrigatório."
                );

        String documentoTratado =
                normalizarTextoObrigatorio(
                        numeroDocumento,
                        "O número do documento do descarte é obrigatório."
                );

        MovimentacaoMaterial movimentacao =
                criarMovimentacaoDeSituacao(
                        material,
                        TipoMovimentacaoMaterial.DESCARTE,
                        situacaoAnterior,
                        SituacaoMaterial.DESCARTADO,
                        motivoTratado,
                        documentoTratado,
                        observacao,
                        usuarioResponsavel
                );

        movimentacaoRepository.save(
                movimentacao
        );
    }

    /*
     * ==========================================
     * REGISTRAR EXTRAVIO PATRIMONIAL
     * ==========================================
     */

    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public void registrarExtravio(
            MaterialPatrimonial material,
            SituacaoMaterial situacaoAnterior,
            String motivo,
            String numeroDocumento,
            String observacao,
            Usuario usuarioResponsavel
    ) {
        validarMaterial(
                material
        );

        validarUsuarioResponsavel(
                usuarioResponsavel
        );

        validarSituacaoAnterior(
                situacaoAnterior
        );

        if (situacaoAnterior != SituacaoMaterial.ATIVO) {
            throw new BusinessException(
                    "A situação anterior do extravio deve ser ATIVO."
            );
        }

        String motivoTratado =
                normalizarTextoObrigatorio(
                        motivo,
                        "O motivo do extravio é obrigatório."
                );

        String documentoTratado =
                normalizarTextoObrigatorio(
                        numeroDocumento,
                        "O número do documento do extravio é obrigatório."
                );

        MovimentacaoMaterial movimentacao =
                criarMovimentacaoDeSituacao(
                        material,
                        TipoMovimentacaoMaterial.EXTRAVIO,
                        situacaoAnterior,
                        SituacaoMaterial.EXTRAVIADO,
                        motivoTratado,
                        documentoTratado,
                        observacao,
                        usuarioResponsavel
                );

        movimentacaoRepository.save(
                movimentacao
        );
    }

    /*
     * ==========================================
     * REGISTRAR FURTO PATRIMONIAL
     * ==========================================
     */

    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public void registrarFurto(
            MaterialPatrimonial material,
            SituacaoMaterial situacaoAnterior,
            String motivo,
            String numeroDocumento,
            String observacao,
            Usuario usuarioResponsavel
    ) {
        validarMaterial(
                material
        );

        validarUsuarioResponsavel(
                usuarioResponsavel
        );

        validarSituacaoAnterior(
                situacaoAnterior
        );

        if (situacaoAnterior != SituacaoMaterial.ATIVO) {
            throw new BusinessException(
                    "A situação anterior do furto deve ser ATIVO."
            );
        }

        String motivoTratado =
                normalizarTextoObrigatorio(
                        motivo,
                        "O motivo do registro de furto é obrigatório."
                );

        String documentoTratado =
                normalizarTextoObrigatorio(
                        numeroDocumento,
                        "O número do boletim de ocorrência é obrigatório."
                );

        MovimentacaoMaterial movimentacao =
                criarMovimentacaoDeSituacao(
                        material,
                        TipoMovimentacaoMaterial.FURTO,
                        situacaoAnterior,
                        SituacaoMaterial.FURTADO,
                        motivoTratado,
                        documentoTratado,
                        observacao,
                        usuarioResponsavel
                );

        movimentacaoRepository.save(
                movimentacao
        );
    }

    /*
     * ==========================================
     * REGISTRAR REATIVAÇÃO PATRIMONIAL
     * ==========================================
     */

    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public void registrarReativacao(
            MaterialPatrimonial material,
            SituacaoMaterial situacaoAnterior,
            String motivo,
            String numeroDocumento,
            String observacao,
            Usuario usuarioResponsavel
    ) {
        validarMaterial(
                material
        );

        validarUsuarioResponsavel(
                usuarioResponsavel
        );

        validarSituacaoAnterior(
                situacaoAnterior
        );

        if (
                situacaoAnterior != SituacaoMaterial.EXTRAVIADO &&
                        situacaoAnterior != SituacaoMaterial.FURTADO
        ) {
            throw new BusinessException(
                    "A reativação somente pode ocorrer para materiais extraviados ou furtados."
            );
        }

        String motivoTratado =
                normalizarTextoObrigatorio(
                        motivo,
                        "O motivo da reativação é obrigatório."
                );

        String documentoTratado =
                normalizarTextoObrigatorio(
                        numeroDocumento,
                        "O número do documento da reativação é obrigatório."
                );

        MovimentacaoMaterial movimentacao =
                criarMovimentacaoDeSituacao(
                        material,
                        TipoMovimentacaoMaterial.REATIVACAO,
                        situacaoAnterior,
                        SituacaoMaterial.ATIVO,
                        motivoTratado,
                        documentoTratado,
                        observacao,
                        usuarioResponsavel
                );

        movimentacaoRepository.save(
                movimentacao
        );
    }

    /*
     * ==========================================
     * LISTAR HISTÓRICO POR MATERIAL
     * ==========================================
     */

    @Override
    @Transactional(readOnly = true)
    public List<MovimentacaoMaterialResponseDTO> listarHistoricoPorMaterial(
            Long materialId,
            Long usuarioId
    ) {
        String unidadeAutorizada = obterUnidadeAutorizada(usuarioId);

        if (materialId == null) {
            throw new BusinessException(
                    "O ID do material é obrigatório."
            );
        }

        MaterialPatrimonial material =
                materialRepository
                        .findById(
                                materialId
                        )
                        .orElseThrow(
                                () -> new ResourceNotFoundException(
                                        "Material patrimonial não encontrado."
                                )
                        );

        if (unidadeAutorizada != null &&
                !unidadeAutorizada.equals(normalizarAcesso(material.getUnidade()))) {
            throw new ResourceNotFoundException("Material patrimonial não encontrado.");
        }

        return movimentacaoRepository
                .findByMaterialIdOrderByDataMovimentacaoDesc(
                        material.getId()
                )
                .stream()
                .map(
                        this::converterParaResponse
                )
                .toList();
    }

    /*
     * ==========================================
     * LISTAR MOVIMENTAÇÕES COM FILTROS
     * ==========================================
     */

    @Override
    @Transactional(readOnly = true)
    public List<MovimentacaoMaterialResponseDTO> listarMovimentacoes(
            MovimentacaoMaterialFiltroDTO filtro,
            Long usuarioId
    ) {
        String unidadeAutorizada = obterUnidadeAutorizada(usuarioId);

        validarPeriodo(
                filtro
        );

        Sort ordenacao = Sort.by(
                Sort.Direction.DESC,
                "dataMovimentacao"
        );

        return movimentacaoRepository
                .findAll(
                        unidadeAutorizada == null
                                ? comFiltros(filtro)
                                : daUnidadeAtualDoMaterial(unidadeAutorizada).and(comFiltros(filtro)),
                        ordenacao
                )
                .stream()
                .map(
                        this::converterParaResponse
                )
                .toList();
    }

    /*
     * ==========================================
     * AUTORIZAÇÃO DAS CONSULTAS PATRIMONIAIS
     * ==========================================
     */

    // null representa consulta global, exclusivamente para ADMIN_MASTER validado.
    private String obterUnidadeAutorizada(Long usuarioId) {
        if (usuarioId == null) {
            throw new ForbiddenException("Usuário autenticado não identificado.");
        }

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ForbiddenException("Usuário autenticado não autorizado."));

        if (!Boolean.TRUE.equals(usuario.getAtivo()) ||
                !"liberado".equals(normalizarAcesso(usuario.getStatusAcesso()))) {
            throw new ForbiddenException("Usuário sem acesso liberado às consultas patrimoniais.");
        }

        if (NivelUsuario.ADMIN_MASTER.getCodigo().equals(usuario.getNivel())) {
            return null;
        }

        String setor = normalizarAcesso(usuario.getSetor());
        boolean p4 = "p4".equals(setor);
        boolean comando = "comando".equals(setor) ||
                "sub-comando".equals(setor) || "subcomando".equals(setor);
        boolean admin = NivelUsuario.ADMIN.getCodigo().equals(usuario.getNivel());
        boolean comum = NivelUsuario.USUARIO_COMUM.getCodigo().equals(usuario.getNivel());
        String unidade = normalizarAcesso(usuario.getUnidade());

        if (!((admin && (p4 || comando)) || (comum && p4)) || unidade.isEmpty()) {
            throw new ForbiddenException("Usuário sem permissão para consultar movimentações patrimoniais.");
        }

        return unidade;
    }

    private String normalizarAcesso(String valor) {
        return valor == null ? "" : valor.trim().toLowerCase(Locale.ROOT);
    }

    /*
     * ==========================================
     * VALIDAR PERÍODO DA CONSULTA
     * ==========================================
     */

    private void validarPeriodo(
            MovimentacaoMaterialFiltroDTO filtro
    ) {
        if (
                filtro == null ||
                        filtro.dataInicial() == null ||
                        filtro.dataFinal() == null
        ) {
            return;
        }

        if (
                filtro.dataInicial()
                        .isAfter(
                                filtro.dataFinal()
                        )
        ) {
            throw new BusinessException(
                    "A data inicial não pode ser posterior à data final."
            );
        }
    }

    /*
     * ==========================================
     * CRIAR MOVIMENTAÇÃO DE SITUAÇÃO
     * ==========================================
     */

    private MovimentacaoMaterial criarMovimentacaoDeSituacao(
            MaterialPatrimonial material,
            TipoMovimentacaoMaterial tipoMovimentacao,
            SituacaoMaterial situacaoAnterior,
            SituacaoMaterial situacaoNova,
            String motivo,
            String numeroDocumento,
            String observacao,
            Usuario usuarioResponsavel
    ) {
        MovimentacaoMaterial movimentacao =
                new MovimentacaoMaterial();

        movimentacao.setMaterialId(
                material.getId()
        );

        movimentacao.setTipoMovimentacao(
                tipoMovimentacao
        );

        movimentacao.setSetorOrigem(
                material.getSetor()
        );

        movimentacao.setSetorDestino(
                null
        );

        movimentacao.setUnidadeOrigem(
                material.getUnidade()
        );

        movimentacao.setUnidadeDestino(
                null
        );

        movimentacao.setSituacaoAnterior(
                situacaoAnterior
        );

        movimentacao.setSituacaoNova(
                situacaoNova
        );

        movimentacao.setMotivo(
                motivo
        );

        movimentacao.setObservacao(
                normalizarObservacao(
                        observacao
                )
        );

        movimentacao.setNumeroDocumento(
                numeroDocumento
        );

        movimentacao.setUsuarioId(
                usuarioResponsavel.getId()
        );

        return movimentacao;
    }

    /*
     * ==========================================
     * VALIDAÇÕES
     * ==========================================
     */

    private void validarMaterial(
            MaterialPatrimonial material
    ) {
        if (
                material == null ||
                        material.getId() == null
        ) {
            throw new BusinessException(
                    "O material da movimentação é obrigatório."
            );
        }
    }

    private void validarUsuarioResponsavel(
            Usuario usuarioResponsavel
    ) {
        if (
                usuarioResponsavel == null ||
                        usuarioResponsavel.getId() == null
        ) {
            throw new BusinessException(
                    "O usuário responsável pela movimentação é obrigatório."
            );
        }
    }

    private void validarSituacaoAnterior(
            SituacaoMaterial situacaoAnterior
    ) {
        if (situacaoAnterior == null) {
            throw new BusinessException(
                    "A situação anterior do material é obrigatória."
            );
        }
    }

    /*
     * ==========================================
     * NORMALIZAÇÃO
     * ==========================================
     */

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

    private String normalizarObservacao(
            String observacao
    ) {
        if (
                observacao == null ||
                        observacao.isBlank()
        ) {
            return "-";
        }

        return observacao.trim();
    }

    /*
     * ==========================================
     * CONVERSÃO PARA RESPONSE
     * ==========================================
     */

    private MovimentacaoMaterialResponseDTO converterParaResponse(
            MovimentacaoMaterial movimentacao
    ) {
        MaterialPatrimonial material =
                movimentacao.getMaterial();

        Usuario usuario =
                movimentacao.getUsuario();

        return new MovimentacaoMaterialResponseDTO(
                movimentacao.getId(),
                movimentacao.getMaterialId(),

                material != null
                        ? material.getNumeroSerie()
                        : null,

                material != null
                        ? material.getNome()
                        : null,

                material != null
                        ? material.getMarca()
                        : null,

                material != null
                        ? material.getDescricao()
                        : null,

                movimentacao.getTipoMovimentacao(),
                movimentacao.getSetorOrigem(),
                movimentacao.getSetorDestino(),
                movimentacao.getUnidadeOrigem(),
                movimentacao.getUnidadeDestino(),
                movimentacao.getSituacaoAnterior(),
                movimentacao.getSituacaoNova(),
                movimentacao.getMotivo(),
                movimentacao.getObservacao(),
                movimentacao.getNumeroDocumento(),
                movimentacao.getUsuarioId(),

                usuario != null
                        ? usuario.getMatricula()
                        : null,

                obterNomeUsuario(
                        usuario
                ),

                movimentacao.getDataMovimentacao()
        );
    }

    private String obterNomeUsuario(
            Usuario usuario
    ) {
        if (usuario == null) {
            return null;
        }

        if (
                usuario.getNomeCompleto() != null &&
                        !usuario.getNomeCompleto().isBlank()
        ) {
            return usuario.getNomeCompleto().trim();
        }

        if (
                usuario.getNome() != null &&
                        !usuario.getNome().isBlank()
        ) {
            return usuario.getNome().trim();
        }

        return null;
    }
}
