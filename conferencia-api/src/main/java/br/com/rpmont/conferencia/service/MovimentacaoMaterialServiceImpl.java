package br.com.rpmont.conferencia.service;

import br.com.rpmont.conferencia.dtos.MovimentacaoMaterialResponseDTO;
import br.com.rpmont.conferencia.enums.SituacaoMaterial;
import br.com.rpmont.conferencia.enums.TipoMovimentacaoMaterial;
import br.com.rpmont.conferencia.exception.BusinessException;
import br.com.rpmont.conferencia.exception.ResourceNotFoundException;
import br.com.rpmont.conferencia.model.MaterialPatrimonial;
import br.com.rpmont.conferencia.model.MovimentacaoMaterial;
import br.com.rpmont.conferencia.model.Usuario;
import br.com.rpmont.conferencia.repository.MaterialPatrimonialRepository;
import br.com.rpmont.conferencia.repository.MovimentacaoMaterialRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MovimentacaoMaterialServiceImpl
        implements MovimentacaoMaterialService {

    private final MovimentacaoMaterialRepository movimentacaoRepository;

    private final MaterialPatrimonialRepository materialRepository;

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
            String matriculaUsuario
    ) {
        if (materialId == null) {
            throw new BusinessException(
                    "O ID do material é obrigatório."
            );
        }

        if (
                matriculaUsuario == null ||
                        matriculaUsuario.isBlank()
        ) {
            throw new BusinessException(
                    "Usuário autenticado não identificado."
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
        return new MovimentacaoMaterialResponseDTO(
                movimentacao.getId(),
                movimentacao.getMaterialId(),
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
                movimentacao.getDataMovimentacao()
        );
    }
}