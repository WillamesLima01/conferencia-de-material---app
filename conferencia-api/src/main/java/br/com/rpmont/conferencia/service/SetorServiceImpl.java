package br.com.rpmont.conferencia.service;

import br.com.rpmont.conferencia.dtos.SetorRequestDTO;
import br.com.rpmont.conferencia.dtos.SetorResponseDTO;
import br.com.rpmont.conferencia.enums.NivelUsuario;
import br.com.rpmont.conferencia.exception.BusinessException;
import br.com.rpmont.conferencia.exception.ConflictException;
import br.com.rpmont.conferencia.exception.ForbiddenException;
import br.com.rpmont.conferencia.exception.ResourceNotFoundException;
import br.com.rpmont.conferencia.model.Setor;
import br.com.rpmont.conferencia.model.Unidade;
import br.com.rpmont.conferencia.model.Usuario;
import br.com.rpmont.conferencia.repository.SetorRepository;
import br.com.rpmont.conferencia.repository.UnidadeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SetorServiceImpl implements SetorService {

    private final SetorRepository setorRepository;
    private final UnidadeRepository unidadeRepository;

    /*
     * ==========================================
     * CADASTRAR
     * ==========================================
     */

    @Override
    @Transactional
    public SetorResponseDTO cadastrar(
            SetorRequestDTO request,
            Usuario usuarioAutenticado
    ) {
        validarUsuarioAutenticado(
                usuarioAutenticado
        );

        validarPermissaoAdministrarSetor(
                usuarioAutenticado
        );

        validarRequest(
                request
        );

        Unidade unidade =
                buscarUnidadePorId(
                        request.unidadeId()
                );

        validarUnidadeAtiva(
                unidade
        );

        validarAcessoUnidade(
                usuarioAutenticado,
                unidade
        );

        String nome =
                normalizarNome(
                        request.nome()
                );

        validarDuplicidadeCadastro(
                nome,
                unidade.getId()
        );

        Setor setor = new Setor();

        setor.setNome(nome);
        setor.setUnidade(unidade);
        setor.setAtivo(true);
        setor.setDataCadastro(
                LocalDateTime.now()
        );
        setor.setDataModificacao(null);
        setor.setUsuarioCadastro(
                usuarioAutenticado
        );
        setor.setUsuarioModificador(null);

        Setor setorSalvo =
                setorRepository.save(
                        setor
                );

        return converterParaResponse(
                setorSalvo
        );
    }

    /*
     * ==========================================
     * LISTAR TODOS
     * ==========================================
     */

    @Override
    @Transactional(readOnly = true)
    public List<SetorResponseDTO> listarTodos(
            Usuario usuarioAutenticado
    ) {
        validarUsuarioAutenticado(
                usuarioAutenticado
        );

        if (isAdminMaster(usuarioAutenticado)) {
            return setorRepository
                    .findAllByOrderByUnidadeNomeAscNomeAsc()
                    .stream()
                    .map(this::converterParaResponse)
                    .toList();
        }

        if (isAdmin(usuarioAutenticado)) {
            Unidade unidadeUsuario =
                    buscarUnidadeDoUsuario(
                            usuarioAutenticado
                    );

            return setorRepository
                    .findByUnidadeIdOrderByNomeAsc(
                            unidadeUsuario.getId()
                    )
                    .stream()
                    .map(this::converterParaResponse)
                    .toList();
        }

        throw new ForbiddenException(
                "Usuário comum não pode listar setores inativos."
        );
    }

    /*
     * ==========================================
     * LISTAR ATIVOS
     * ==========================================
     */

    @Override
    @Transactional(readOnly = true)
    public List<SetorResponseDTO> listarAtivos(
            Usuario usuarioAutenticado
    ) {
        validarUsuarioAutenticado(
                usuarioAutenticado
        );

        if (isAdminMaster(usuarioAutenticado)) {
            return setorRepository
                    .findByAtivoTrueOrderByUnidadeNomeAscNomeAsc()
                    .stream()
                    .map(this::converterParaResponse)
                    .toList();
        }

        Unidade unidadeUsuario =
                buscarUnidadeDoUsuario(
                        usuarioAutenticado
                );

        return setorRepository
                .findByUnidadeIdAndAtivoTrueOrderByNomeAsc(
                        unidadeUsuario.getId()
                )
                .stream()
                .map(this::converterParaResponse)
                .toList();
    }

    /*
     * ==========================================
     * LISTAR POR UNIDADE
     * ==========================================
     */

    @Override
    @Transactional(readOnly = true)
    public List<SetorResponseDTO> listarPorUnidade(
            Long unidadeId,
            Usuario usuarioAutenticado
    ) {
        validarUsuarioAutenticado(
                usuarioAutenticado
        );

        if (isUsuarioComum(usuarioAutenticado)) {
            throw new ForbiddenException(
                    "Usuário comum não pode listar setores inativos."
            );
        }

        Unidade unidade =
                buscarUnidadePorId(
                        unidadeId
                );

        validarAcessoUnidade(
                usuarioAutenticado,
                unidade
        );

        return setorRepository
                .findByUnidadeIdOrderByNomeAsc(
                        unidade.getId()
                )
                .stream()
                .map(this::converterParaResponse)
                .toList();
    }

    /*
     * ==========================================
     * LISTAR ATIVOS POR UNIDADE
     * ==========================================
     */

    @Override
    @Transactional(readOnly = true)
    public List<SetorResponseDTO> listarAtivosPorUnidade(
            Long unidadeId,
            Usuario usuarioAutenticado
    ) {
        validarUsuarioAutenticado(
                usuarioAutenticado
        );

        Unidade unidade =
                buscarUnidadePorId(
                        unidadeId
                );

        validarAcessoUnidade(
                usuarioAutenticado,
                unidade
        );

        return setorRepository
                .findByUnidadeIdAndAtivoTrueOrderByNomeAsc(
                        unidade.getId()
                )
                .stream()
                .map(this::converterParaResponse)
                .toList();
    }

    /*
     * ==========================================
     * BUSCAR POR ID
     * ==========================================
     */

    @Override
    @Transactional(readOnly = true)
    public SetorResponseDTO buscarPorId(
            Long id,
            Usuario usuarioAutenticado
    ) {
        validarUsuarioAutenticado(
                usuarioAutenticado
        );

        Setor setor =
                buscarSetorPorId(
                        id
                );

        validarAcessoUnidade(
                usuarioAutenticado,
                setor.getUnidade()
        );

        if (
                isUsuarioComum(usuarioAutenticado) &&
                        !Boolean.TRUE.equals(setor.getAtivo())
        ) {
            throw new ForbiddenException(
                    "Usuário comum não pode acessar setor inativo."
            );
        }

        return converterParaResponse(
                setor
        );
    }

    /*
     * ==========================================
     * ATUALIZAR
     * ==========================================
     */

    @Override
    @Transactional
    public SetorResponseDTO atualizar(
            Long id,
            SetorRequestDTO request,
            Usuario usuarioAutenticado
    ) {
        validarUsuarioAutenticado(
                usuarioAutenticado
        );

        validarPermissaoAdministrarSetor(
                usuarioAutenticado
        );

        validarRequest(
                request
        );

        Setor setor =
                buscarSetorPorId(
                        id
                );

        validarSetorAtivo(
                setor
        );

        Unidade unidade =
                buscarUnidadePorId(
                        request.unidadeId()
                );

        validarUnidadeAtiva(
                unidade
        );

        validarAcessoUnidade(
                usuarioAutenticado,
                setor.getUnidade()
        );

        validarAcessoUnidade(
                usuarioAutenticado,
                unidade
        );

        String nome =
                normalizarNome(
                        request.nome()
                );

        validarDuplicidadeEdicao(
                nome,
                unidade.getId(),
                setor.getId()
        );

        setor.setNome(nome);
        setor.setUnidade(unidade);
        setor.setDataModificacao(
                LocalDateTime.now()
        );
        setor.setUsuarioModificador(
                usuarioAutenticado
        );

        Setor setorAtualizado =
                setorRepository.save(
                        setor
                );

        return converterParaResponse(
                setorAtualizado
        );
    }

    /*
     * ==========================================
     * INATIVAR
     * ==========================================
     */

    @Override
    @Transactional
    public SetorResponseDTO inativar(
            Long id,
            Usuario usuarioAutenticado
    ) {
        validarUsuarioAutenticado(
                usuarioAutenticado
        );

        validarPermissaoAdministrarSetor(
                usuarioAutenticado
        );

        Setor setor =
                buscarSetorPorId(
                        id
                );

        validarAcessoUnidade(
                usuarioAutenticado,
                setor.getUnidade()
        );

        if (!Boolean.TRUE.equals(setor.getAtivo())) {
            throw new ConflictException(
                    "O setor já está inativo."
            );
        }

        setor.setAtivo(false);
        setor.setDataModificacao(
                LocalDateTime.now()
        );
        setor.setUsuarioModificador(
                usuarioAutenticado
        );

        Setor setorInativado =
                setorRepository.save(
                        setor
                );

        return converterParaResponse(
                setorInativado
        );
    }

    /*
     * ==========================================
     * REATIVAR
     * ==========================================
     */

    @Override
    @Transactional
    public SetorResponseDTO reativar(
            Long id,
            Usuario usuarioAutenticado
    ) {
        validarUsuarioAutenticado(
                usuarioAutenticado
        );

        validarPermissaoAdministrarSetor(
                usuarioAutenticado
        );

        Setor setor =
                buscarSetorPorId(
                        id
                );

        validarAcessoUnidade(
                usuarioAutenticado,
                setor.getUnidade()
        );

        validarUnidadeAtiva(
                setor.getUnidade()
        );

        if (Boolean.TRUE.equals(setor.getAtivo())) {
            throw new ConflictException(
                    "O setor já está ativo."
            );
        }

        validarDuplicidadeEdicao(
                setor.getNome(),
                setor.getUnidade().getId(),
                setor.getId()
        );

        setor.setAtivo(true);
        setor.setDataModificacao(
                LocalDateTime.now()
        );
        setor.setUsuarioModificador(
                usuarioAutenticado
        );

        Setor setorReativado =
                setorRepository.save(
                        setor
                );

        return converterParaResponse(
                setorReativado
        );
    }

    /*
     * ==========================================
     * VALIDAÇÃO DO USUÁRIO
     * ==========================================
     */

    private void validarUsuarioAutenticado(
            Usuario usuario
    ) {
        if (
                usuario == null ||
                        usuario.getId() == null
        ) {
            throw new ForbiddenException(
                    "Usuário autenticado não identificado."
            );
        }

        if (!Boolean.TRUE.equals(usuario.getAtivo())) {
            throw new ForbiddenException(
                    "Usuário autenticado está inativo."
            );
        }
    }

    private void validarPermissaoAdministrarSetor(
            Usuario usuario
    ) {
        if (
                !isAdminMaster(usuario) &&
                        !isAdmin(usuario)
        ) {
            throw new ForbiddenException(
                    "Usuário sem permissão para administrar setores."
            );
        }
    }

    /*
     * ==========================================
     * VALIDAÇÃO DE ACESSO À UNIDADE
     * ==========================================
     */

    private void validarAcessoUnidade(
            Usuario usuario,
            Unidade unidade
    ) {
        if (isAdminMaster(usuario)) {
            return;
        }

        if (!usuarioPertenceUnidade(usuario, unidade)) {
            throw new ForbiddenException(
                    "Você não possui permissão para acessar setores de outra unidade."
            );
        }
    }

    private boolean usuarioPertenceUnidade(
            Usuario usuario,
            Unidade unidade
    ) {
        if (
                usuario == null ||
                        unidade == null ||
                        usuario.getUnidade() == null
        ) {
            return false;
        }

        String unidadeUsuario =
                usuario.getUnidade().trim();

        boolean correspondeSigla =
                unidade.getSigla() != null &&
                        unidadeUsuario.equalsIgnoreCase(
                                unidade.getSigla().trim()
                        );

        boolean correspondeNome =
                unidade.getNome() != null &&
                        unidadeUsuario.equalsIgnoreCase(
                                unidade.getNome().trim()
                        );

        return correspondeSigla ||
                correspondeNome;
    }

    /*
     * ==========================================
     * BUSCAS
     * ==========================================
     */

    private Setor buscarSetorPorId(
            Long id
    ) {
        if (id == null) {
            throw new BusinessException(
                    "O ID do setor é obrigatório."
            );
        }

        return setorRepository
                .findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Setor não encontrado."
                        )
                );
    }

    private Unidade buscarUnidadePorId(
            Long id
    ) {
        if (id == null) {
            throw new BusinessException(
                    "O ID da unidade é obrigatório."
            );
        }

        return unidadeRepository
                .findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Unidade não encontrada."
                        )
                );
    }

    private Unidade buscarUnidadeDoUsuario(
            Usuario usuario
    ) {
        if (
                usuario.getUnidade() == null ||
                        usuario.getUnidade().isBlank()
        ) {
            throw new BusinessException(
                    "O usuário autenticado não possui unidade cadastrada."
            );
        }

        String unidadeUsuario =
                usuario.getUnidade().trim();

        return unidadeRepository
                .findBySiglaIgnoreCase(
                        unidadeUsuario
                )
                .or(() ->
                        unidadeRepository
                                .findByNomeIgnoreCase(
                                        unidadeUsuario
                                )
                )
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "A unidade do usuário autenticado não foi encontrada."
                        )
                );
    }

    /*
     * ==========================================
     * VALIDAÇÕES
     * ==========================================
     */

    private void validarRequest(
            SetorRequestDTO request
    ) {
        if (request == null) {
            throw new BusinessException(
                    "Os dados do setor são obrigatórios."
            );
        }
    }

    private void validarUnidadeAtiva(
            Unidade unidade
    ) {
        if (!Boolean.TRUE.equals(unidade.getAtivo())) {
            throw new ConflictException(
                    "Não é possível cadastrar ou reativar setor em unidade inativa."
            );
        }
    }

    private void validarSetorAtivo(
            Setor setor
    ) {
        if (!Boolean.TRUE.equals(setor.getAtivo())) {
            throw new ConflictException(
                    "Não é possível editar um setor inativo."
            );
        }
    }

    private void validarDuplicidadeCadastro(
            String nome,
            Long unidadeId
    ) {
        boolean existe =
                setorRepository
                        .existsByNomeIgnoreCaseAndUnidadeId(
                                nome,
                                unidadeId
                        );

        if (existe) {
            throw new ConflictException(
                    "Já existe um setor com esse nome nesta unidade."
            );
        }
    }

    private void validarDuplicidadeEdicao(
            String nome,
            Long unidadeId,
            Long setorId
    ) {
        boolean existe =
                setorRepository
                        .existsByNomeIgnoreCaseAndUnidadeIdAndIdNot(
                                nome,
                                unidadeId,
                                setorId
                        );

        if (existe) {
            throw new ConflictException(
                    "Já existe outro setor com esse nome nesta unidade."
            );
        }
    }

    /*
     * ==========================================
     * PERFIS
     * ==========================================
     */

    private boolean isAdminMaster(
            Usuario usuario
    ) {
        return usuario != null &&
                NivelUsuario.ADMIN_MASTER
                        .getCodigo()
                        .equals(usuario.getNivel());
    }

    private boolean isAdmin(
            Usuario usuario
    ) {
        return usuario != null &&
                NivelUsuario.ADMIN
                        .getCodigo()
                        .equals(usuario.getNivel());
    }

    private boolean isUsuarioComum(
            Usuario usuario
    ) {
        return usuario != null &&
                NivelUsuario.USUARIO_COMUM
                        .getCodigo()
                        .equals(usuario.getNivel());
    }

    /*
     * ==========================================
     * NORMALIZAÇÃO
     * ==========================================
     */

    private String normalizarNome(
            String nome
    ) {
        if (
                nome == null ||
                        nome.isBlank()
        ) {
            throw new BusinessException(
                    "O nome do setor é obrigatório."
            );
        }

        return nome
                .trim()
                .replaceAll(
                        "\\s+",
                        " "
                );
    }

    /*
     * ==========================================
     * RESPONSE
     * ==========================================
     */

    private SetorResponseDTO converterParaResponse(
            Setor setor
    ) {
        Unidade unidade =
                setor.getUnidade();

        Usuario usuarioCadastro =
                setor.getUsuarioCadastro();

        Usuario usuarioModificador =
                setor.getUsuarioModificador();

        return new SetorResponseDTO(
                setor.getId(),
                setor.getNome(),

                unidade != null
                        ? unidade.getId()
                        : null,

                unidade != null
                        ? unidade.getNome()
                        : null,

                unidade != null
                        ? unidade.getSigla()
                        : null,

                setor.getAtivo(),
                setor.getDataCadastro(),
                setor.getDataModificacao(),

                usuarioCadastro != null
                        ? usuarioCadastro.getId()
                        : null,

                usuarioCadastro != null
                        ? usuarioCadastro.getNome()
                        : null,

                usuarioModificador != null
                        ? usuarioModificador.getId()
                        : null,

                usuarioModificador != null
                        ? usuarioModificador.getNome()
                        : null
        );
    }
}