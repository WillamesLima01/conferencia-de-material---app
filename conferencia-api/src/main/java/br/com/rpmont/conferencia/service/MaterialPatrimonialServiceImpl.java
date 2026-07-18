package br.com.rpmont.conferencia.service;

import br.com.rpmont.conferencia.dtos.MaterialPatrimonialRequestDTO;
import br.com.rpmont.conferencia.dtos.MaterialPatrimonialResponseDTO;
import br.com.rpmont.conferencia.dtos.TransferirConferirMaterialRequestDTO;
import br.com.rpmont.conferencia.exception.BusinessException;
import br.com.rpmont.conferencia.exception.ConflictException;
import br.com.rpmont.conferencia.exception.ForbiddenException;
import br.com.rpmont.conferencia.exception.ResourceNotFoundException;
import br.com.rpmont.conferencia.model.MaterialPatrimonial;
import br.com.rpmont.conferencia.model.Usuario;
import br.com.rpmont.conferencia.repository.MaterialPatrimonialRepository;
import br.com.rpmont.conferencia.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MaterialPatrimonialServiceImpl
        implements MaterialPatrimonialService {

    private static final int NIVEL_ADMIN_MASTER = 1;

    private static final String SETOR_P4 = "P4";

    private static final String STATUS_LIBERADO = "LIBERADO";

    private static final String SITUACAO_ATIVO = "ATIVO";

    private static final String SITUACAO_INATIVO = "INATIVO";

    private final MaterialPatrimonialRepository materialRepository;

    private final UsuarioRepository usuarioRepository;

    /*
     * ==========================================
     * CADASTRAR
     * ==========================================
     */

    @Override
    @Transactional
    public MaterialPatrimonialResponseDTO cadastrar(
            MaterialPatrimonialRequestDTO request,
            String matriculaUsuario
    ) {
        Usuario usuarioLogado =
                buscarUsuarioAutenticado(
                        matriculaUsuario
                );

        validarAcessoPatrimonio(
                usuarioLogado
        );

        validarDadosObrigatorios(
                request
        );

        String numeroSerie =
                normalizarTextoObrigatorio(
                        request.numeroSerie(),
                        "O número de série é obrigatório."
                );

        boolean numeroSerieJaExiste =
                materialRepository
                        .existsByNumeroSerieIgnoreCase(
                                numeroSerie
                        );

        if (numeroSerieJaExiste) {
            throw new ConflictException(
                    "Já existe um material cadastrado com esse número de série."
            );
        }

        MaterialPatrimonial material =
                new MaterialPatrimonial();

        material.setNumeroSerie(
                numeroSerie
        );

        material.setDescricao(
                normalizarTextoObrigatorio(
                        request.descricao(),
                        "A descrição é obrigatória."
                )
        );

        material.setObservacao(
                normalizarObservacao(
                        request.observacao()
                )
        );

        material.setSetor(
                normalizarTextoObrigatorio(
                        request.setor(),
                        "O setor é obrigatório."
                )
        );

        material.setUnidade(
                normalizarTextoObrigatorio(
                        usuarioLogado.getUnidade(),
                        "O usuário autenticado não possui unidade cadastrada."
                )
        );

        LocalDateTime agora =
                LocalDateTime.now();

        material.setDataCadastro(
                LocalDate.now()
        );

        material.setUsuarioId(
                usuarioLogado.getId()
        );

        material.setDataModificacao(
                agora
        );

        material.setUsuarioModificadorId(
                usuarioLogado.getId()
        );

        material.setConferido(
                Boolean.TRUE.equals(
                        request.conferido()
                )
        );

        material.setSituacao(
                SITUACAO_ATIVO
        );

        MaterialPatrimonial salvo =
                materialRepository.save(
                        material
                );

        return converterParaResponse(
                salvo
        );
    }

    /*
     * ==========================================
     * LISTAR
     * ==========================================
     */

    @Override
    @Transactional(readOnly = true)
    public List<MaterialPatrimonialResponseDTO> listar(
            String matriculaUsuario
    ) {
        Usuario usuarioLogado =
                buscarUsuarioAutenticado(
                        matriculaUsuario
                );

        validarAcessoPatrimonio(
                usuarioLogado
        );

        List<MaterialPatrimonial> materiais;

        if (usuarioEhAdminMaster(usuarioLogado)) {
            materiais =
                    materialRepository.findAll();
        } else {
            materiais =
                    materialRepository
                            .findByUnidadeIgnoreCase(
                                    usuarioLogado.getUnidade()
                            );
        }

        return materiais
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
    public MaterialPatrimonialResponseDTO buscarPorId(
            Long id,
            String matriculaUsuario
    ) {
        Usuario usuarioLogado =
                buscarUsuarioAutenticado(
                        matriculaUsuario
                );

        validarAcessoPatrimonio(
                usuarioLogado
        );

        MaterialPatrimonial material =
                buscarMaterialPorId(
                        id
                );

        validarAcessoUnidade(
                usuarioLogado,
                material
        );

        return converterParaResponse(
                material
        );
    }

    /*
     * ==========================================
     * BUSCAR POR NÚMERO DE SÉRIE
     * ==========================================
     */

    @Override
    @Transactional(readOnly = true)
    public MaterialPatrimonialResponseDTO buscarPorNumeroSerie(
            String numeroSerie,
            String matriculaUsuario
    ) {
        Usuario usuarioLogado =
                buscarUsuarioAutenticado(
                        matriculaUsuario
                );

        validarAcessoPatrimonio(
                usuarioLogado
        );

        String numeroSerieTratado =
                normalizarTextoObrigatorio(
                        numeroSerie,
                        "O número de série é obrigatório."
                );

        MaterialPatrimonial material =
                materialRepository
                        .findByNumeroSerieIgnoreCase(
                                numeroSerieTratado
                        )
                        .orElseThrow(
                                () -> new ResourceNotFoundException(
                                        "Material patrimonial não encontrado."
                                )
                        );

        validarAcessoUnidade(
                usuarioLogado,
                material
        );

        return converterParaResponse(
                material
        );
    }

    /*
     * ==========================================
     * ATUALIZAR
     * ==========================================
     */

    @Override
    @Transactional
    public MaterialPatrimonialResponseDTO atualizar(
            Long id,
            MaterialPatrimonialRequestDTO request,
            String matriculaUsuario
    ) {
        Usuario usuarioLogado =
                buscarUsuarioAutenticado(
                        matriculaUsuario
                );

        validarAcessoPatrimonio(
                usuarioLogado
        );

        validarDadosObrigatorios(
                request
        );

        MaterialPatrimonial material =
                buscarMaterialPorId(
                        id
                );

        validarAcessoUnidade(
                usuarioLogado,
                material
        );

        validarMaterialAtivo(
                material
        );

        String numeroSerie =
                normalizarTextoObrigatorio(
                        request.numeroSerie(),
                        "O número de série é obrigatório."
                );

        materialRepository
                .findByNumeroSerieIgnoreCase(
                        numeroSerie
                )
                .filter(
                        materialEncontrado ->
                                !materialEncontrado
                                        .getId()
                                        .equals(id)
                )
                .ifPresent(
                        materialEncontrado -> {
                            throw new ConflictException(
                                    "Já existe outro material com esse número de série."
                            );
                        }
                );

        material.setNumeroSerie(
                numeroSerie
        );

        material.setDescricao(
                normalizarTextoObrigatorio(
                        request.descricao(),
                        "A descrição é obrigatória."
                )
        );

        material.setObservacao(
                normalizarObservacao(
                        request.observacao()
                )
        );

        material.setSetor(
                normalizarTextoObrigatorio(
                        request.setor(),
                        "O setor é obrigatório."
                )
        );

        if (request.conferido() != null) {
            material.setConferido(
                    request.conferido()
            );
        }

        material.setDataModificacao(
                LocalDateTime.now()
        );

        material.setUsuarioModificadorId(
                usuarioLogado.getId()
        );

        MaterialPatrimonial atualizado =
                materialRepository.save(
                        material
                );

        return converterParaResponse(
                atualizado
        );
    }

    /*
     * ==========================================
     * CONFERIR
     * ==========================================
     */

    @Override
    @Transactional
    public MaterialPatrimonialResponseDTO conferir(
            Long id,
            String matriculaUsuario
    ) {
        Usuario usuarioLogado =
                buscarUsuarioAutenticado(
                        matriculaUsuario
                );

        validarAcessoPatrimonio(
                usuarioLogado
        );

        MaterialPatrimonial material =
                buscarMaterialPorId(
                        id
                );

        validarAcessoUnidade(
                usuarioLogado,
                material
        );

        validarMaterialAtivo(
                material
        );

        material.setConferido(
                true
        );

        material.setDataModificacao(
                LocalDateTime.now()
        );

        material.setUsuarioModificadorId(
                usuarioLogado.getId()
        );

        MaterialPatrimonial atualizado =
                materialRepository.save(
                        material
                );

        return converterParaResponse(
                atualizado
        );
    }

    /*
     * ==========================================
     * TRANSFERIR SETOR E CONFERIR
     * ==========================================
     */

    @Override
    @Transactional
    public MaterialPatrimonialResponseDTO transferirEConferir(
            Long id,
            TransferirConferirMaterialRequestDTO request,
            String matriculaUsuario
    ) {
        Usuario usuarioLogado =
                buscarUsuarioAutenticado(
                        matriculaUsuario
                );

        validarAcessoPatrimonio(
                usuarioLogado
        );

        if (request == null) {
            throw new BusinessException(
                    "Os dados da transferência são obrigatórios."
            );
        }

        MaterialPatrimonial material =
                buscarMaterialPorId(
                        id
                );

        validarAcessoUnidade(
                usuarioLogado,
                material
        );

        validarMaterialAtivo(
                material
        );

        String novoSetor =
                normalizarTextoObrigatorio(
                        request.novoSetor(),
                        "O novo setor é obrigatório."
                );

        String unidadeInformada =
                normalizarTextoObrigatorio(
                        request.unidade(),
                        "A unidade é obrigatória."
                );

        if (
                material.getUnidade() == null ||
                        !material.getUnidade()
                                .trim()
                                .equalsIgnoreCase(
                                        unidadeInformada
                                )
        ) {
            throw new ConflictException(
                    "A unidade informada não corresponde à unidade do material."
            );
        }

        if (
                !usuarioEhAdminMaster(usuarioLogado) &&
                        (
                                usuarioLogado.getUnidade() == null ||
                                        !usuarioLogado.getUnidade()
                                                .trim()
                                                .equalsIgnoreCase(
                                                        unidadeInformada
                                                )
                        )
        ) {
            throw new ForbiddenException(
                    "Você não possui permissão para transferir materiais desta unidade."
            );
        }

        material.setSetor(
                novoSetor
        );

        material.setConferido(
                true
        );

        material.setDataModificacao(
                LocalDateTime.now()
        );

        material.setUsuarioModificadorId(
                usuarioLogado.getId()
        );

        MaterialPatrimonial atualizado =
                materialRepository.save(
                        material
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
    public MaterialPatrimonialResponseDTO inativar(
            Long id,
            String matriculaUsuario
    ) {
        Usuario usuarioLogado =
                buscarUsuarioAutenticado(
                        matriculaUsuario
                );

        validarAcessoPatrimonio(
                usuarioLogado
        );

        MaterialPatrimonial material =
                buscarMaterialPorId(
                        id
                );

        validarAcessoUnidade(
                usuarioLogado,
                material
        );

        if (
                SITUACAO_INATIVO.equalsIgnoreCase(
                        material.getSituacao()
                )
        ) {
            throw new ConflictException(
                    "O material já está inativo."
            );
        }

        material.setSituacao(
                SITUACAO_INATIVO
        );

        material.setConferido(
                false
        );

        material.setDataModificacao(
                LocalDateTime.now()
        );

        material.setUsuarioModificadorId(
                usuarioLogado.getId()
        );

        MaterialPatrimonial atualizado =
                materialRepository.save(
                        material
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
            throw new BusinessException(
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
                        () -> new ResourceNotFoundException(
                                "Usuário autenticado não encontrado."
                        )
                );
    }

    /*
     * ==========================================
     * VALIDAÇÕES DE ACESSO
     * ==========================================
     */

    private void validarAcessoPatrimonio(
            Usuario usuario
    ) {
        if (!Boolean.TRUE.equals(
                usuario.getAtivo()
        )) {
            throw new ForbiddenException(
                    "Usuário inativo."
            );
        }

        if (
                usuario.getStatusAcesso() == null ||
                        !STATUS_LIBERADO.equalsIgnoreCase(
                                usuario.getStatusAcesso()
                        )
        ) {
            throw new ForbiddenException(
                    "O acesso do usuário não está liberado."
            );
        }

        if (
                usuario.getSetor() == null ||
                        !SETOR_P4.equalsIgnoreCase(
                                usuario.getSetor().trim()
                        )
        ) {
            throw new ForbiddenException(
                    "Acesso permitido somente para usuários do setor P4."
            );
        }
    }

    private void validarAcessoUnidade(
            Usuario usuario,
            MaterialPatrimonial material
    ) {
        if (usuarioEhAdminMaster(usuario)) {
            return;
        }

        if (
                usuario.getUnidade() == null ||
                        material.getUnidade() == null ||
                        !usuario.getUnidade()
                                .trim()
                                .equalsIgnoreCase(
                                        material.getUnidade().trim()
                                )
        ) {
            throw new ForbiddenException(
                    "Você não possui permissão para acessar materiais de outra unidade."
            );
        }
    }

    private boolean usuarioEhAdminMaster(
            Usuario usuario
    ) {
        return usuario.getNivel() != null &&
                usuario.getNivel() ==
                        NIVEL_ADMIN_MASTER;
    }

    /*
     * ==========================================
     * VALIDAÇÕES DO MATERIAL
     * ==========================================
     */

    private void validarDadosObrigatorios(
            MaterialPatrimonialRequestDTO request
    ) {
        if (request == null) {
            throw new BusinessException(
                    "Os dados do material são obrigatórios."
            );
        }
    }

    private void validarMaterialAtivo(
            MaterialPatrimonial material
    ) {
        if (
                material.getSituacao() == null ||
                        !SITUACAO_ATIVO.equalsIgnoreCase(
                                material.getSituacao()
                        )
        ) {
            throw new ConflictException(
                    "Não é possível alterar um material inativo."
            );
        }
    }

    private MaterialPatrimonial buscarMaterialPorId(
            Long id
    ) {
        if (id == null) {
            throw new BusinessException(
                    "O ID do material é obrigatório."
            );
        }

        return materialRepository
                .findById(
                        id
                )
                .orElseThrow(
                        () -> new ResourceNotFoundException(
                                "Material patrimonial não encontrado."
                        )
                );
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

    private MaterialPatrimonialResponseDTO converterParaResponse(
            MaterialPatrimonial material
    ) {
        return new MaterialPatrimonialResponseDTO(
                material.getId(),
                material.getNumeroSerie(),
                material.getNome(),
                material.getMarca(),
                material.getDescricao(),
                material.getObservacao(),
                material.getSetor(),
                material.getUnidade(),
                material.getDataCadastro(),
                material.getUsuarioId(),
                material.getDataModificacao(),
                material.getUsuarioModificadorId(),
                material.getConferido(),
                material.getSituacao()
        );
    }
}