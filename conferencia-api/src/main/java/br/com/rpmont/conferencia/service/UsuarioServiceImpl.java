package br.com.rpmont.conferencia.service;

import br.com.rpmont.conferencia.dtos.UsuarioRequestDTO;
import br.com.rpmont.conferencia.dtos.UsuarioResponseDTO;
import br.com.rpmont.conferencia.dtos.UsuarioStatusRequestDTO;
import br.com.rpmont.conferencia.enums.NivelUsuario;
import br.com.rpmont.conferencia.enums.StatusAcessoUsuario;
import br.com.rpmont.conferencia.model.Usuario;
import br.com.rpmont.conferencia.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

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
    public UsuarioResponseDTO solicitarAcesso(UsuarioRequestDTO usuarioRequestDTO) {

        validarMatriculaEmailDuplicados(usuarioRequestDTO);

        Usuario usuario = new Usuario();

        preencherDadosUsuario(usuario, usuarioRequestDTO);

        usuario.setNivel(NivelUsuario.USUARIO_COMUM.getCodigo());
        usuario.setStatusAcesso(StatusAcessoUsuario.PENDENTE.name());
        usuario.setAtivo(0);
        usuario.setDataSolicitacao(LocalDateTime.now());
        usuario.setDataLiberacao(null);
        usuario.setLiberadoPor(null);
        usuario.setDataCadastro(LocalDate.now());
        usuario.setDataModificacao(LocalDateTime.now());
        usuario.setUserModificador(0);

        Usuario usuarioSalvo = usuarioRepository.save(usuario);

        return toResponse(usuarioSalvo);
    }

    @Transactional
    @Override
    public UsuarioResponseDTO salvarUsuario(UsuarioRequestDTO usuarioRequestDTO) {

        Usuario usuarioLogado = getUsuarioLogado();

        validarMatriculaEmailDuplicados(usuarioRequestDTO);
        validarPermissaoCadastrarUsuario(usuarioLogado, usuarioRequestDTO);

        Usuario usuario = new Usuario();

        preencherDadosUsuario(usuario, usuarioRequestDTO);

        Integer nivel = usuarioRequestDTO.nivel();
        String statusAcesso = normalizarStatus(usuarioRequestDTO.statusAcesso());

        if (!nivelValido(nivel)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Nível de usuário inválido."
            );
        }

        if (!statusValido(statusAcesso)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Status de acesso inválido."
            );
        }

        usuario.setNivel(nivel);
        usuario.setStatusAcesso(statusAcesso);
        usuario.setAtivo(definirAtivoPorStatus(statusAcesso));
        usuario.setDataSolicitacao(LocalDateTime.now());

        if (StatusAcessoUsuario.LIBERADO.name().equals(statusAcesso)) {
            usuario.setDataLiberacao(LocalDateTime.now());
            usuario.setLiberadoPor(usuarioLogado.getId().intValue());
        } else {
            usuario.setDataLiberacao(null);
            usuario.setLiberadoPor(null);
        }

        usuario.setDataCadastro(LocalDate.now());
        usuario.setDataModificacao(LocalDateTime.now());
        usuario.setUserModificador(usuarioLogado.getId().intValue());

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
            return usuarioRepository.findByUnidade(usuarioLogado.getUnidade())
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

        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Usuário não encontrado no banco de dados."
                ));

        validarPermissaoVisualizarUsuario(usuarioLogado, usuario);

        return toResponse(usuario);
    }

    @Transactional(readOnly = true)
    @Override
    public UsuarioResponseDTO buscarUsuarioPorMatricula(String matricula) {

        Usuario usuarioLogado = getUsuarioLogado();

        Usuario usuario = usuarioRepository.findByMatricula(limparTexto(matricula))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Usuário não encontrado com essa matrícula."
                ));

        validarPermissaoVisualizarUsuario(usuarioLogado, usuario);

        return toResponse(usuario);
    }

    @Transactional
    @Override
    public UsuarioResponseDTO atualizarUsuarioPorId(Long id, UsuarioRequestDTO usuarioRequestDTO) {

        Usuario usuarioExistente = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Usuário não encontrado no banco de dados."
                ));

        Usuario usuarioLogado = getUsuarioLogado();

        validarPermissaoAtualizarUsuario(usuarioLogado, usuarioExistente, usuarioRequestDTO);

        String matricula = limparTexto(usuarioRequestDTO.matricula());
        String email = limparTexto(usuarioRequestDTO.email());

        usuarioRepository.findByMatricula(matricula)
                .ifPresent(usuarioEncontrado -> {
                    if (!Objects.equals(usuarioEncontrado.getId(), id)) {
                        throw new ResponseStatusException(
                                HttpStatus.CONFLICT,
                                "Já existe outro usuário cadastrado com essa matrícula."
                        );
                    }
                });

        if (email != null) {
            usuarioRepository.findByEmail(email)
                    .ifPresent(usuarioEncontrado -> {
                        if (!Objects.equals(usuarioEncontrado.getId(), id)) {
                            throw new ResponseStatusException(
                                    HttpStatus.CONFLICT,
                                    "Já existe outro usuário cadastrado com esse e-mail."
                            );
                        }
                    });
        }

        Integer nivel = usuarioRequestDTO.nivel();

        if (!nivelValido(nivel)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Nível de usuário inválido."
            );
        }

        preencherDadosUsuario(usuarioExistente, usuarioRequestDTO);

        usuarioExistente.setNivel(nivel);
        usuarioExistente.setDataModificacao(LocalDateTime.now());
        usuarioExistente.setUserModificador(usuarioLogado.getId().intValue());

        Usuario usuarioAtualizado = usuarioRepository.save(usuarioExistente);

        return toResponse(usuarioAtualizado);
    }

    @Transactional
    @Override
    public UsuarioResponseDTO alterarStatusUsuario(Long id, UsuarioStatusRequestDTO usuarioStatusRequestDTO) {

        Usuario usuarioExistente = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Usuário não encontrado no banco de dados."
                ));

        Usuario usuarioLogado = getUsuarioLogado();

        validarPermissaoAlterarStatus(usuarioLogado, usuarioExistente);

        String statusAcesso = normalizarStatus(usuarioStatusRequestDTO.statusAcesso());

        if (!statusValido(statusAcesso)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Status de acesso inválido."
            );
        }

        usuarioExistente.setStatusAcesso(statusAcesso);
        usuarioExistente.setAtivo(definirAtivoPorStatus(statusAcesso));

        if (StatusAcessoUsuario.LIBERADO.name().equals(statusAcesso)) {
            usuarioExistente.setDataLiberacao(LocalDateTime.now());
            usuarioExistente.setLiberadoPor(usuarioLogado.getId().intValue());
        } else {
            usuarioExistente.setDataLiberacao(null);
            usuarioExistente.setLiberadoPor(null);
        }

        usuarioExistente.setDataModificacao(LocalDateTime.now());
        usuarioExistente.setUserModificador(usuarioLogado.getId().intValue());

        Usuario usuarioAtualizado = usuarioRepository.save(usuarioExistente);

        return toResponse(usuarioAtualizado);
    }

    @Transactional
    @Override
    public void deletarUsuarioId(Long id) {

        Usuario usuarioExistente = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Usuário não encontrado."
                ));

        Usuario usuarioLogado = getUsuarioLogado();

        validarPermissaoDeletarUsuario(usuarioLogado, usuarioExistente);

        usuarioRepository.delete(usuarioExistente);
    }

    private void validarMatriculaEmailDuplicados(UsuarioRequestDTO usuarioRequestDTO) {

        String matricula = limparTexto(usuarioRequestDTO.matricula());
        String email = limparTexto(usuarioRequestDTO.email());

        if (usuarioRepository.existsByMatricula(matricula)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Já existe um usuário cadastrado com essa matrícula."
            );
        }

        if (email != null && usuarioRepository.existsByEmail(email)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Já existe um usuário cadastrado com esse e-mail."
            );
        }
    }

    private void preencherDadosUsuario(Usuario usuario, UsuarioRequestDTO usuarioRequestDTO) {

        usuario.setMatricula(limparTexto(usuarioRequestDTO.matricula()));
        usuario.setNome(limparTexto(usuarioRequestDTO.nome()));
        usuario.setSenha(limparTexto(usuarioRequestDTO.senha()));
        usuario.setEmail(limparTexto(usuarioRequestDTO.email()));
        usuario.setPostGrad(limparTexto(usuarioRequestDTO.postGrad()));
        usuario.setSetor(limparTexto(usuarioRequestDTO.setor()));
        usuario.setNomeCompleto(limparTexto(usuarioRequestDTO.nomeCompleto()));
        usuario.setUnidade(limparTexto(usuarioRequestDTO.unidade()));
    }

    private Usuario getUsuarioLogado() {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || authentication.getPrincipal() == null) {
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
                NivelUsuario.ADMIN_MASTER.getCodigo().equals(usuario.getNivel());
    }

    private boolean isAdmin(Usuario usuario) {
        return usuario != null &&
                NivelUsuario.ADMIN.getCodigo().equals(usuario.getNivel());
    }

    private boolean isUsuarioComum(Usuario usuario) {
        return usuario != null &&
                NivelUsuario.USUARIO_COMUM.getCodigo().equals(usuario.getNivel());
    }

    private boolean mesmaUnidade(Usuario usuarioLogado, Usuario usuarioAlvo) {
        return usuarioLogado != null &&
                usuarioAlvo != null &&
                usuarioLogado.getUnidade() != null &&
                usuarioAlvo.getUnidade() != null &&
                usuarioLogado.getUnidade().equalsIgnoreCase(usuarioAlvo.getUnidade());
    }

    private void validarPermissaoVisualizarUsuario(Usuario usuarioLogado, Usuario usuarioAlvo) {

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
            UsuarioRequestDTO usuarioRequestDTO
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

        String unidadeNovoUsuario = limparTexto(usuarioRequestDTO.unidade());

        if (unidadeNovoUsuario == null ||
                usuarioLogado.getUnidade() == null ||
                !unidadeNovoUsuario.equalsIgnoreCase(usuarioLogado.getUnidade())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Administrador só pode cadastrar usuário da própria unidade."
            );
        }

        Integer nivelNovoUsuario = usuarioRequestDTO.nivel();

        if (NivelUsuario.ADMIN_MASTER.getCodigo().equals(nivelNovoUsuario)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Administrador não pode cadastrar Admin Master."
            );
        }
    }

    private void validarPermissaoAtualizarUsuario(
            Usuario usuarioLogado,
            Usuario usuarioAlvo,
            UsuarioRequestDTO usuarioRequestDTO
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

        Integer novoNivel = usuarioRequestDTO.nivel();

        if (NivelUsuario.ADMIN_MASTER.getCodigo().equals(novoNivel)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Administrador não pode elevar usuário para Admin Master."
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

    private boolean nivelValido(Integer nivel) {
        return nivel != null &&
                (
                        nivel.equals(NivelUsuario.ADMIN_MASTER.getCodigo()) ||
                                nivel.equals(NivelUsuario.ADMIN.getCodigo()) ||
                                nivel.equals(NivelUsuario.USUARIO_COMUM.getCodigo())
                );
    }

    private boolean statusValido(String statusAcesso) {
        if (statusAcesso == null) {
            return false;
        }

        for (StatusAcessoUsuario status : StatusAcessoUsuario.values()) {
            if (status.name().equals(statusAcesso)) {
                return true;
            }
        }

        return false;
    }

    private Integer definirAtivoPorStatus(String statusAcesso) {
        if (StatusAcessoUsuario.LIBERADO.name().equals(statusAcesso)) {
            return 1;
        }

        return 0;
    }

    private String normalizarStatus(String statusAcesso) {
        String statusTratado = limparTexto(statusAcesso);

        if (statusTratado == null) {
            return null;
        }

        return statusTratado.toUpperCase();
    }

    private UsuarioResponseDTO toResponse(Usuario usuario) {
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
                usuario.getDataCadastro(),
                usuario.getDataModificacao()
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