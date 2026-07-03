package br.com.rpmont.conferencia.service;

import br.com.rpmont.conferencia.dtos.UsuarioNivelRequestDTO;
import br.com.rpmont.conferencia.dtos.UsuarioRequestDTO;
import br.com.rpmont.conferencia.dtos.UsuarioResponseDTO;
import br.com.rpmont.conferencia.enums.NivelUsuario;
import br.com.rpmont.conferencia.model.Usuario;
import br.com.rpmont.conferencia.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
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
    public UsuarioResponseDTO salvarUsuario(UsuarioRequestDTO usuarioRequestDTO) {

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

        Usuario usuario = new Usuario();

        preencherDadosUsuario(usuario, usuarioRequestDTO);

        /*
         * Regra de cadastro comum:
         * Todo usuário novo entra como usuário comum, pendente e sem acesso ativo.
         * Alteração de nível deve ser feita pelo endpoint específico de nível.
         */
        usuario.setNivel(NivelUsuario.USUARIO_COMUM.getCodigo());
        usuario.setStatusAcesso("PENDENTE");
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

    @Transactional(readOnly = true)
    @Override
    public List<UsuarioResponseDTO> listarTodosUsuario() {
        return usuarioRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    @Override
    public UsuarioResponseDTO buscarUsuarioPorId(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Usuário não encontrado no banco de dados."
                ));

        return toResponse(usuario);
    }

    @Transactional(readOnly = true)
    @Override
    public UsuarioResponseDTO buscarUsuarioPorMatricula(String matricula) {
        Usuario usuario = usuarioRepository.findByMatricula(limparTexto(matricula))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Usuário não encontrado com essa matrícula."
                ));

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

        /*
         * Atualização comum:
         * Não altera nível, status ou ativo.
         * Esses campos devem ser alterados em endpoints próprios.
         */
        preencherDadosUsuario(usuarioExistente, usuarioRequestDTO);

        usuarioExistente.setDataModificacao(LocalDateTime.now());
        usuarioExistente.setUserModificador(0);

        Usuario usuarioAtualizado = usuarioRepository.save(usuarioExistente);

        return toResponse(usuarioAtualizado);
    }

    @Transactional
    @Override
    public UsuarioResponseDTO alterarNivelUsuario(Long id, UsuarioNivelRequestDTO usuarioNivelRequestDTO) {

        Usuario usuarioExistente = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Usuário não encontrado no banco de dados."
                ));

        Integer nivel = usuarioNivelRequestDTO.nivel();

        if (!nivelValido(nivel)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Nível de usuário inválido."
            );
        }

        usuarioExistente.setNivel(nivel);
        usuarioExistente.setDataModificacao(LocalDateTime.now());
        usuarioExistente.setUserModificador(0);

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

        usuarioRepository.delete(usuarioExistente);
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

    private boolean nivelValido(Integer nivel) {
        return nivel != null &&
                (
                        nivel.equals(NivelUsuario.ADMIN_MASTER.getCodigo()) ||
                                nivel.equals(NivelUsuario.ADMIN.getCodigo()) ||
                                nivel.equals(NivelUsuario.USUARIO_COMUM.getCodigo())
                );
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