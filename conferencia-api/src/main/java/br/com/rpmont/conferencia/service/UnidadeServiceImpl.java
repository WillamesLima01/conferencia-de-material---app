package br.com.rpmont.conferencia.service;

import br.com.rpmont.conferencia.dtos.UnidadeRequestDTO;
import br.com.rpmont.conferencia.dtos.UnidadeResponseDTO;
import br.com.rpmont.conferencia.exception.ConflictException;
import br.com.rpmont.conferencia.exception.ForbiddenException;
import br.com.rpmont.conferencia.exception.ResourceNotFoundException;
import br.com.rpmont.conferencia.model.Unidade;
import br.com.rpmont.conferencia.model.Usuario;
import br.com.rpmont.conferencia.repository.UnidadeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UnidadeServiceImpl
        implements UnidadeService {

    private static final int NIVEL_ADMIN_MASTER = 1;

    private final UnidadeRepository unidadeRepository;

    @Override
    @Transactional
    public UnidadeResponseDTO cadastrar(
            UnidadeRequestDTO request,
            Usuario usuarioAutenticado
    ) {
        validarUsuarioAutenticado(
                usuarioAutenticado
        );

        validarAdminMaster(
                usuarioAutenticado
        );

        String nome =
                normalizarNome(
                        request.nome()
                );

        String sigla =
                normalizarSigla(
                        request.sigla()
                );

        validarDuplicidadeCadastro(
                nome,
                sigla
        );

        Unidade unidade = new Unidade();

        unidade.setNome(nome);
        unidade.setSigla(sigla);
        unidade.setAtivo(true);
        unidade.setDataCadastro(
                LocalDateTime.now()
        );
        unidade.setDataModificacao(null);
        unidade.setUsuarioCadastro(
                usuarioAutenticado
        );
        unidade.setUsuarioModificador(null);

        Unidade unidadeSalva =
                unidadeRepository.save(
                        unidade
                );

        return converterParaResponse(
                unidadeSalva
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<UnidadeResponseDTO> listarTodas(
            Usuario usuarioAutenticado
    ) {
        validarUsuarioAutenticado(
                usuarioAutenticado
        );

        validarAdminMaster(
                usuarioAutenticado
        );

        return unidadeRepository
                .findAllByOrderByNomeAsc()
                .stream()
                .map(
                        this::converterParaResponse
                )
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<UnidadeResponseDTO> listarAtivas(
            Usuario usuarioAutenticado
    ) {
        validarUsuarioAutenticado(
                usuarioAutenticado
        );

        return unidadeRepository
                .findByAtivoTrueOrderByNomeAsc()
                .stream()
                .map(
                        this::converterParaResponse
                )
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public UnidadeResponseDTO buscarPorId(
            Long id,
            Usuario usuarioAutenticado
    ) {
        validarUsuarioAutenticado(
                usuarioAutenticado
        );

        Unidade unidade =
                buscarUnidadePorId(id);

        return converterParaResponse(
                unidade
        );
    }

    @Override
    @Transactional
    public UnidadeResponseDTO atualizar(
            Long id,
            UnidadeRequestDTO request,
            Usuario usuarioAutenticado
    ) {
        validarUsuarioAutenticado(
                usuarioAutenticado
        );

        validarAdminMaster(
                usuarioAutenticado
        );

        Unidade unidade =
                buscarUnidadePorId(id);

        if (!Boolean.TRUE.equals(
                unidade.getAtivo()
        )) {
            throw new ConflictException(
                    "Não é possível editar uma unidade inativa."
            );
        }

        String nome =
                normalizarNome(
                        request.nome()
                );

        String sigla =
                normalizarSigla(
                        request.sigla()
                );

        validarDuplicidadeEdicao(
                id,
                nome,
                sigla
        );

        unidade.setNome(nome);
        unidade.setSigla(sigla);
        unidade.setDataModificacao(
                LocalDateTime.now()
        );
        unidade.setUsuarioModificador(
                usuarioAutenticado
        );

        Unidade unidadeAtualizada =
                unidadeRepository.save(
                        unidade
                );

        return converterParaResponse(
                unidadeAtualizada
        );
    }

    @Override
    @Transactional
    public UnidadeResponseDTO inativar(
            Long id,
            Usuario usuarioAutenticado
    ) {
        validarUsuarioAutenticado(
                usuarioAutenticado
        );

        validarAdminMaster(
                usuarioAutenticado
        );

        Unidade unidade =
                buscarUnidadePorId(id);

        if (!Boolean.TRUE.equals(
                unidade.getAtivo()
        )) {
            throw new ConflictException(
                    "A unidade já está inativa."
            );
        }

        unidade.setAtivo(false);
        unidade.setDataModificacao(
                LocalDateTime.now()
        );
        unidade.setUsuarioModificador(
                usuarioAutenticado
        );

        Unidade unidadeInativada =
                unidadeRepository.save(
                        unidade
                );

        return converterParaResponse(
                unidadeInativada
        );
    }

    @Override
    @Transactional
    public UnidadeResponseDTO reativar(
            Long id,
            Usuario usuarioAutenticado
    ) {
        validarUsuarioAutenticado(
                usuarioAutenticado
        );

        validarAdminMaster(
                usuarioAutenticado
        );

        Unidade unidade =
                buscarUnidadePorId(id);

        if (Boolean.TRUE.equals(
                unidade.getAtivo()
        )) {
            throw new ConflictException(
                    "A unidade já está ativa."
            );
        }

        validarDuplicidadeReativacao(
                unidade
        );

        unidade.setAtivo(true);
        unidade.setDataModificacao(
                LocalDateTime.now()
        );
        unidade.setUsuarioModificador(
                usuarioAutenticado
        );

        Unidade unidadeReativada =
                unidadeRepository.save(
                        unidade
                );

        return converterParaResponse(
                unidadeReativada
        );
    }

    private void validarUsuarioAutenticado(
            Usuario usuarioAutenticado
    ) {
        if (usuarioAutenticado == null) {
            throw new ForbiddenException(
                    "Usuário autenticado não identificado."
            );
        }

        if (usuarioAutenticado.getId() == null) {
            throw new ForbiddenException(
                    "Usuário autenticado inválido."
            );
        }

        if (!Boolean.TRUE.equals(
                usuarioAutenticado.getAtivo()
        )) {
            throw new ForbiddenException(
                    "Usuário autenticado está inativo."
            );
        }
    }

    private void validarAdminMaster(
            Usuario usuarioAutenticado
    ) {
        Integer nivel =
                usuarioAutenticado.getNivel();

        if (
                nivel == null ||
                        nivel != NIVEL_ADMIN_MASTER
        ) {
            throw new ForbiddenException(
                    "Somente ADMIN_MASTER pode administrar unidades."
            );
        }
    }

    private Unidade buscarUnidadePorId(
            Long id
    ) {
        if (id == null) {
            throw new ResourceNotFoundException(
                    "Unidade não encontrada."
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

    private void validarDuplicidadeCadastro(
            String nome,
            String sigla
    ) {
        boolean siglaJaCadastrada =
                unidadeRepository
                        .existsBySiglaIgnoreCase(
                                sigla
                        );

        if (siglaJaCadastrada) {
            throw new ConflictException(
                    "Já existe uma unidade cadastrada com a sigla "
                            + sigla
                            + "."
            );
        }

        boolean nomeJaCadastrado =
                unidadeRepository
                        .existsByNomeIgnoreCase(
                                nome
                        );

        if (nomeJaCadastrado) {
            throw new ConflictException(
                    "Já existe uma unidade cadastrada com esse nome."
            );
        }
    }

    private void validarDuplicidadeEdicao(
            Long id,
            String nome,
            String sigla
    ) {
        boolean outraSiglaJaCadastrada =
                unidadeRepository
                        .existsBySiglaIgnoreCaseAndIdNot(
                                sigla,
                                id
                        );

        if (outraSiglaJaCadastrada) {
            throw new ConflictException(
                    "Já existe outra unidade cadastrada com a sigla "
                            + sigla
                            + "."
            );
        }

        boolean outroNomeJaCadastrado =
                unidadeRepository
                        .existsByNomeIgnoreCaseAndIdNot(
                                nome,
                                id
                        );

        if (outroNomeJaCadastrado) {
            throw new ConflictException(
                    "Já existe outra unidade cadastrada com esse nome."
            );
        }
    }

    private void validarDuplicidadeReativacao(
            Unidade unidade
    ) {
        validarDuplicidadeEdicao(
                unidade.getId(),
                unidade.getNome(),
                unidade.getSigla()
        );
    }

    private String normalizarNome(
            String nome
    ) {
        if (nome == null) {
            return "";
        }

        return nome
                .trim()
                .replaceAll(
                        "\\s+",
                        " "
                );
    }

    private String normalizarSigla(
            String sigla
    ) {
        if (sigla == null) {
            return "";
        }

        return sigla
                .trim()
                .replaceAll(
                        "\\s+",
                        ""
                )
                .toUpperCase();
    }

    private UnidadeResponseDTO converterParaResponse(
            Unidade unidade
    ) {
        Usuario usuarioCadastro =
                unidade.getUsuarioCadastro();

        Usuario usuarioModificador =
                unidade.getUsuarioModificador();

        return new UnidadeResponseDTO(
                unidade.getId(),
                unidade.getNome(),
                unidade.getSigla(),
                unidade.getAtivo(),
                unidade.getDataCadastro(),
                unidade.getDataModificacao(),

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