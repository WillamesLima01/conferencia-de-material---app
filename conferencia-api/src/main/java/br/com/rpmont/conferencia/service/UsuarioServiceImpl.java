package br.com.rpmont.conferencia.service;

import br.com.rpmont.conferencia.dtos.UsuarioAdminRequestDTO;
import br.com.rpmont.conferencia.dtos.UsuarioNivelRequestDTO;
import br.com.rpmont.conferencia.dtos.UsuarioRequestDTO;
import br.com.rpmont.conferencia.dtos.UsuarioResponseDTO;
import br.com.rpmont.conferencia.dtos.UsuarioStatusRequestDTO;
import br.com.rpmont.conferencia.enums.NivelUsuario;
import br.com.rpmont.conferencia.enums.StatusAcessoUsuario;
import br.com.rpmont.conferencia.model.Usuario;
import br.com.rpmont.conferencia.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

@RequiredArgsConstructor
@Service
public class UsuarioServiceImpl implements UsuarioService {

    private final UsuarioRepository usuarioRepository;

    @Transactional
    @Override
    public UsuarioResponseDTO solicitarAcesso(
            UsuarioRequestDTO usuarioRequestDTO
    ) {

        validarMatriculaEmailDuplicados(
                usuarioRequestDTO.matricula(),
                usuarioRequestDTO.email()
        );

        Usuario usuario = new Usuario();

        preencherDadosSolicitacao(usuario, usuarioRequestDTO);

        usuario.setNivel(NivelUsuario.USUARIO_COMUM.getCodigo());
        usuario.setStatusAcesso(StatusAcessoUsuario.PENDENTE.name());
        usuario.setAtivo(0);
        usuario.setDataSolicitacao(LocalDateTime.now());
        usuario.setDataLiberacao(null);
        usuario.setLiberadoPor(null);
        usuario.setDataCadastro(LocalDate.now());
        usuario.setDataModificacao(LocalDateTime.now());
        usuario.setUserModificador(null);

        Usuario usuarioSalvo = usuarioRepository.save(usuario);

        return toResponse(usuarioSalvo);
    }

    @Transactional
    @Override
    public UsuarioResponseDTO salvarUsuario(
            UsuarioAdminRequestDTO usuarioAdminRequestDTO
    ) {

        Usuario usuarioLogado = getUsuarioLogado();

        validarMatriculaEmailDuplicados(
                usuarioAdminRequestDTO.matricula(),
                usuarioAdminRequestDTO.email()
        );

        validarPermissaoCadastrarUsuario(
                usuarioLogado,
                usuarioAdminRequestDTO
        );

        Integer nivel = usuarioAdminRequestDTO.nivel();
        String statusAcesso = normalizarStatus(
                usuarioAdminRequestDTO.statusAcesso()
        );

        validarNivel(nivel);
        validarStatus(statusAcesso);

        Usuario usuario = new Usuario();

        preencherDadosAdministrativos(
                usuario,
                usuarioAdminRequestDTO
        );

        usuario.setNivel(nivel);
        usuario.setStatusAcesso(statusAcesso);
        usuario.setAtivo(definirAtivoPorStatus(statusAcesso));
        usuario.setDataSolicitacao(LocalDateTime.now());

        if (StatusAcessoUsuario.LIBERADO.name().equals(statusAcesso)) {
            usuario.setDataLiberacao(LocalDateTime.now());
            usuario.setLiberadoPor(usuarioLogado.getId());
        } else {
            usuario.setDataLiberacao(null);
            usuario.setLiberadoPor(null);
        }

        usuario.setDataCadastro(LocalDate.now());
        usuario.setDataModificacao(LocalDateTime.now());
        usuario.setUserModificador(null);

        Usuario usuarioSalvo = usuarioRepository.save(usuario);

        return toResponse(usuarioSalvo);
    }

    @Transactional(readOnly = true)
    @Override
    public List<UsuarioResponseDTO> listarTodosUsuario() {

        Usuario usuarioLogado = getUsuarioLogado();

        if (isAdminMaster(usuarioLogado)) {
            return usuarioRepository.findAll()
                    .stream()
                    .map(this::toResponse)
                    .toList();
        }

        if (isAdmin(usuarioLogado)) {
            return usuarioRepository
                    .findByUnidade(usuarioLogado.getUnidade())
                    .stream()
                    .filter(usuario -> !isAdminMaster(usuario))
                    .map(this::toResponse)
                    .toList();
        }

        throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Usuário sem permissão para listar usuários."
        );
    }

    @Transactional(readOnly = true)
    @Override
    public UsuarioResponseDTO buscarUsuarioPorId(Long id) {

        Usuario usuarioLogado = getUsuarioLogado();

        Usuario usuario = buscarUsuario(id);

        validarPermissaoVisualizarUsuario(
                usuarioLogado,
                usuario
        );

        return toResponse(usuario);
    }

    @Transactional(readOnly = true)
    @Override
    public UsuarioResponseDTO buscarUsuarioPorMatricula(
            String matricula
    ) {

        Usuario usuarioLogado = getUsuarioLogado();

        Usuario usuario = usuarioRepository
                .findByMatricula(limparTexto(matricula))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Usuário não encontrado com essa matrícula."
                ));

        validarPermissaoVisualizarUsuario(
                usuarioLogado,
                usuario
        );

        return toResponse(usuario);
    }

    @Transactional
    @Override
    public UsuarioResponseDTO atualizarUsuarioPorId(
            Long id,
            UsuarioAdminRequestDTO usuarioAdminRequestDTO
    ) {

        Usuario usuarioExistente = buscarUsuario(id);
        Usuario usuarioLogado = getUsuarioLogado();

        validarPermissaoAtualizarUsuario(
                usuarioLogado,
                usuarioExistente
        );

        validarDuplicidadeNaAtualizacao(
                id,
                usuarioAdminRequestDTO.matricula(),
                usuarioAdminRequestDTO.email()
        );

        preencherDadosAdministrativos(
                usuarioExistente,
                usuarioAdminRequestDTO
        );

        usuarioExistente.setDataModificacao(LocalDateTime.now());
        usuarioExistente.setUserModificador(usuarioLogado.getId());

        Usuario usuarioAtualizado =
                usuarioRepository.save(usuarioExistente);

        return toResponse(usuarioAtualizado);
    }

    @Transactional
    @Override
    public UsuarioResponseDTO alterarStatusUsuario(
            Long id,
            UsuarioStatusRequestDTO usuarioStatusRequestDTO
    ) {

        Usuario usuarioExistente = buscarUsuario(id);
        Usuario usuarioLogado = getUsuarioLogado();

        validarPermissaoAlterarStatus(
                usuarioLogado,
                usuarioExistente
        );

        String statusAcesso = normalizarStatus(
                usuarioStatusRequestDTO.statusAcesso()
        );

        validarStatus(statusAcesso);

        usuarioExistente.setStatusAcesso(statusAcesso);
        usuarioExistente.setAtivo(definirAtivoPorStatus(statusAcesso)
        );

        if (StatusAcessoUsuario.LIBERADO.name().equals(statusAcesso)) {

            usuarioExistente.setDataLiberacao(LocalDateTime.now());

            usuarioExistente.setLiberadoPor(usuarioLogado.getId());

        } else {

            usuarioExistente.setDataLiberacao(null);
            usuarioExistente.setLiberadoPor(null);
        }

        usuarioExistente.setDataModificacao(LocalDateTime.now());

        Usuario usuarioAtualizado = usuarioRepository.save(usuarioExistente);

        return toResponse(usuarioAtualizado);
    }

    @Transactional
    @Override
    public UsuarioResponseDTO alterarNivelUsuario(
            Long id,
            UsuarioNivelRequestDTO usuarioNivelRequestDTO
    ) {

        Usuario usuarioExistente = buscarUsuario(id);
        Usuario usuarioLogado = getUsuarioLogado();

        Integer novoNivel = usuarioNivelRequestDTO.nivel();

        validarNivel(novoNivel);

        validarPermissaoAlterarNivel(
                usuarioLogado,
                usuarioExistente,
                novoNivel
        );

        usuarioExistente.setNivel(novoNivel);
        usuarioExistente.setDataModificacao(LocalDateTime.now());
        usuarioExistente.setUserModificador(usuarioLogado.getId());

        Usuario usuarioAtualizado =
                usuarioRepository.save(usuarioExistente);

        return toResponse(usuarioAtualizado);
    }

    @Transactional
    @Override
    public void deletarUsuarioId(Long id) {

        Usuario usuarioExistente = buscarUsuario(id);
        Usuario usuarioLogado = getUsuarioLogado();

        validarPermissaoDeletarUsuario(
                usuarioLogado,
                usuarioExistente
        );

        usuarioRepository.delete(usuarioExistente);
    }

    private Usuario buscarUsuario(Long id) {

        return usuarioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Usuário não encontrado no banco de dados."
                ));
    }

    private void validarMatriculaEmailDuplicados(
            String matricula,
            String email
    ) {

        String matriculaTratada = limparTexto(matricula);
        String emailTratado = limparTexto(email);

        if (usuarioRepository.existsByMatricula(matriculaTratada)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Já existe um usuário cadastrado com essa matrícula."
            );
        }

        if (emailTratado != null &&
                usuarioRepository.existsByEmail(emailTratado)) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Já existe um usuário cadastrado com esse e-mail."
            );
        }
    }

    private void validarDuplicidadeNaAtualizacao(
            Long id,
            String matricula,
            String email
    ) {

        String matriculaTratada = limparTexto(matricula);
        String emailTratado = limparTexto(email);

        usuarioRepository.findByMatricula(matriculaTratada)
                .ifPresent(usuarioEncontrado -> {

                    if (!Objects.equals(
                            usuarioEncontrado.getId(),
                            id
                    )) {

                        throw new ResponseStatusException(
                                HttpStatus.CONFLICT,
                                "Já existe outro usuário cadastrado com essa matrícula."
                        );
                    }
                });

        if (emailTratado != null) {

            usuarioRepository.findByEmail(emailTratado)
                    .ifPresent(usuarioEncontrado -> {

                        if (!Objects.equals(
                                usuarioEncontrado.getId(),
                                id
                        )) {

                            throw new ResponseStatusException(
                                    HttpStatus.CONFLICT,
                                    "Já existe outro usuário cadastrado com esse e-mail."
                            );
                        }
                    });
        }
    }

    private void preencherDadosSolicitacao(
            Usuario usuario,
            UsuarioRequestDTO dto
    ) {

        usuario.setMatricula(limparTexto(dto.matricula()));
        usuario.setNome(limparTexto(dto.nome()));
        usuario.setSenha(limparTexto(dto.senha()));
        usuario.setEmail(limparTexto(dto.email()));
        usuario.setPostGrad(limparTexto(dto.postGrad()));
        usuario.setSetor(limparTexto(dto.setor()));
        usuario.setNomeCompleto(limparTexto(dto.nomeCompleto()));
        usuario.setUnidade(limparTexto(dto.unidade()));
    }

    private void preencherDadosAdministrativos(
            Usuario usuario,
            UsuarioAdminRequestDTO dto
    ) {

        usuario.setMatricula(limparTexto(dto.matricula()));
        usuario.setNome(limparTexto(dto.nome()));
        usuario.setSenha(limparTexto(dto.senha()));
        usuario.setEmail(limparTexto(dto.email()));
        usuario.setPostGrad(limparTexto(dto.postGrad()));
        usuario.setSetor(limparTexto(dto.setor()));
        usuario.setNomeCompleto(limparTexto(dto.nomeCompleto()));
        usuario.setUnidade(limparTexto(dto.unidade()));
    }

    private Usuario getUsuarioLogado() {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null ||
                authentication.getPrincipal() == null) {

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Usuário não autenticado."
            );
        }

        Object principal = authentication.getPrincipal();

        if (!(principal instanceof Usuario usuario)) {

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Usuário autenticado inválido."
            );
        }

        return usuario;
    }

    private boolean isAdminMaster(Usuario usuario) {

        return usuario != null &&
                NivelUsuario.ADMIN_MASTER
                        .getCodigo()
                        .equals(usuario.getNivel());
    }

    private boolean isAdmin(Usuario usuario) {

        return usuario != null &&
                NivelUsuario.ADMIN
                        .getCodigo()
                        .equals(usuario.getNivel());
    }

    private boolean isUsuarioComum(Usuario usuario) {

        return usuario != null &&
                NivelUsuario.USUARIO_COMUM
                        .getCodigo()
                        .equals(usuario.getNivel());
    }

    private boolean mesmaUnidade(
            Usuario usuarioLogado,
            Usuario usuarioAlvo
    ) {

        return usuarioLogado != null &&
                usuarioAlvo != null &&
                usuarioLogado.getUnidade() != null &&
                usuarioAlvo.getUnidade() != null &&
                usuarioLogado.getUnidade()
                        .equalsIgnoreCase(usuarioAlvo.getUnidade());
    }

    private void validarPermissaoVisualizarUsuario(
            Usuario usuarioLogado,
            Usuario usuarioAlvo
    ) {

        if (isAdminMaster(usuarioLogado)) {
            return;
        }

        if (isAdmin(usuarioLogado)) {

            if (!mesmaUnidade(usuarioLogado, usuarioAlvo)) {

                throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "Administrador só pode visualizar usuário da própria unidade."
                );
            }

            if (isAdminMaster(usuarioAlvo)) {

                throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "Administrador não pode visualizar Admin Master."
                );
            }

            return;
        }

        throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Você não tem permissão para visualizar este usuário."
        );
    }

    private void validarPermissaoCadastrarUsuario(
            Usuario usuarioLogado,
            UsuarioAdminRequestDTO dto
    ) {

        if (isAdminMaster(usuarioLogado)) {
            return;
        }

        if (!isAdmin(usuarioLogado)) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Você não tem permissão para cadastrar usuários."
            );
        }

        String unidadeNovoUsuario =
                limparTexto(dto.unidade());

        if (unidadeNovoUsuario == null ||
                usuarioLogado.getUnidade() == null ||
                !unidadeNovoUsuario.equalsIgnoreCase(
                        usuarioLogado.getUnidade()
                )) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Administrador só pode cadastrar usuário da própria unidade."
            );
        }

        if (!NivelUsuario.USUARIO_COMUM
                .getCodigo()
                .equals(dto.nivel())) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Administrador só pode cadastrar usuário comum."
            );
        }
    }

    private void validarPermissaoAtualizarUsuario(
            Usuario usuarioLogado,
            Usuario usuarioAlvo
    ) {

        if (isAdminMaster(usuarioLogado)) {
            return;
        }

        if (!isAdmin(usuarioLogado)) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Você não tem permissão para editar usuários."
            );
        }

        if (!mesmaUnidade(usuarioLogado, usuarioAlvo)) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Administrador só pode editar usuário da própria unidade."
            );
        }

        if (isAdminMaster(usuarioAlvo)) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Administrador não pode editar Admin Master."
            );
        }

        if (isAdmin(usuarioAlvo)) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Administrador não pode editar outro administrador."
            );
        }
    }

    private void validarPermissaoAlterarStatus(
            Usuario usuarioLogado,
            Usuario usuarioAlvo
    ) {

        if (isAdminMaster(usuarioLogado)) {
            return;
        }

        if (!isAdmin(usuarioLogado)) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Você não tem permissão para alterar status de usuários."
            );
        }

        if (!mesmaUnidade(usuarioLogado, usuarioAlvo)) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Administrador só pode alterar status de usuário da própria unidade."
            );
        }

        if (!isUsuarioComum(usuarioAlvo)) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Administrador só pode alterar status de usuário comum."
            );
        }
    }

    private void validarPermissaoAlterarNivel(
            Usuario usuarioLogado,
            Usuario usuarioAlvo,
            Integer novoNivel
    ) {

        if (isAdminMaster(usuarioLogado)) {

            if (Objects.equals(
                    usuarioLogado.getId(),
                    usuarioAlvo.getId()
            )) {

                throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "Admin Master não pode alterar o próprio nível."
                );
            }

            return;
        }

        if (!isAdmin(usuarioLogado)) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Você não tem permissão para alterar nível de usuário."
            );
        }

        if (!mesmaUnidade(usuarioLogado, usuarioAlvo)) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Administrador só pode alterar nível de usuário da própria unidade."
            );
        }

        if (!isUsuarioComum(usuarioAlvo)) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Administrador só pode alterar nível de usuário comum."
            );
        }

        if (!NivelUsuario.ADMIN
                .getCodigo()
                .equals(novoNivel) &&
                !NivelUsuario.USUARIO_COMUM
                        .getCodigo()
                        .equals(novoNivel)) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Administrador não pode atribuir nível Admin Master."
            );
        }
    }

    private void validarPermissaoDeletarUsuario(
            Usuario usuarioLogado,
            Usuario usuarioAlvo
    ) {

        if (isAdminMaster(usuarioLogado)) {
            return;
        }

        throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Somente Admin Master pode excluir usuários."
        );
    }

    private void validarNivel(Integer nivel) {

        if (!nivelValido(nivel)) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Nível de usuário inválido."
            );
        }
    }

    private void validarStatus(String statusAcesso) {

        if (!statusValido(statusAcesso)) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Status de acesso inválido."
            );
        }
    }

    private boolean nivelValido(Integer nivel) {

        return nivel != null &&
                (
                        nivel.equals(
                                NivelUsuario.ADMIN_MASTER.getCodigo()
                        ) ||
                                nivel.equals(
                                        NivelUsuario.ADMIN.getCodigo()
                                ) ||
                                nivel.equals(
                                        NivelUsuario.USUARIO_COMUM.getCodigo()
                                )
                );
    }

    private boolean statusValido(String statusAcesso) {

        if (statusAcesso == null) {
            return false;
        }

        for (StatusAcessoUsuario status :
                StatusAcessoUsuario.values()) {

            if (status.name().equals(statusAcesso)) {
                return true;
            }
        }

        return false;
    }

    private Integer definirAtivoPorStatus(
            String statusAcesso
    ) {

        if (StatusAcessoUsuario.LIBERADO
                .name()
                .equals(statusAcesso)) {

            return 1;
        }

        return 0;
    }

    private String normalizarStatus(
            String statusAcesso
    ) {

        String statusTratado = limparTexto(statusAcesso);

        if (statusTratado == null) {
            return null;
        }

        return statusTratado.toUpperCase();
    }

    private UsuarioResponseDTO toResponse(
            Usuario usuario
    ) {

        return new UsuarioResponseDTO(
                usuario.getId(),
                usuario.getMatricula(),
                usuario.getNome(),
                usuario.getEmail(),
                usuario.getNivel(),
                usuario.getPostGrad(),
                usuario.getSetor(),
                usuario.getNomeCompleto(),
                usuario.getUnidade(),
                usuario.getStatusAcesso(),
                usuario.getAtivo(),
                usuario.getDataSolicitacao(),
                usuario.getDataLiberacao(),
                usuario.getLiberadoPor(),
                usuario.getDataCadastro(),
                usuario.getDataModificacao(),
                usuario.getUserModificador()
        );
    }

    private String limparTexto(String texto) {

        if (texto == null) {
            return null;
        }

        String textoTratado = texto.trim();

        if (textoTratado.isBlank()) {
            return null;
        }

        return textoTratado;
    }
}