package br.com.rpmont.conferencia.service;

import br.com.rpmont.conferencia.dtos.UsuarioRequestDTO;
import br.com.rpmont.conferencia.dtos.UsuarioResponseDTO;
import br.com.rpmont.conferencia.model.Usuario;
import br.com.rpmont.conferencia.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

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

        if (usuarioRepository.existByMatricula(matricula)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Já existe um usuário cadastrado com essa matrícula."
            );
        }

        if (email != null && usuarioRepository.existByEmail(email)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Já existe um usuário cadastrado com esse e-mail."
            );
        }

        Usuario usuario = new Usuario();

        preencherDadosUsuario(usuario, usuarioRequestDTO);

        Usuario usuarioSalvo = usuarioRepository.save(usuario);

        return toResponse(usuarioSalvo);
    }

    @Transactional
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
                .orElseThrow(()-> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Usuário não encontrado no banco de dados."));

        return toResponse(usuario);
    }

    @Transactional(readOnly = true)
    @Override
    public UsuarioResponseDTO buscarUsuarioPorMatricula(String matricula) {
        Usuario usuario = usuarioRepository.findByMatricula(limparTexto(matricula))
                .orElseThrow(()-> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Usuário não encontrado com essa matrícula."));

        return toResponse(usuario);
    }

    @Transactional
    @Override
    public UsuarioResponseDTO atualizarUsuarioPorId(Long id, UsuarioRequestDTO usuarioRequestDTO) {

        Usuario usuarioExistente = usuarioRepository.findById(id)
                .orElseThrow(()-> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Usuário não encontrado no banco de dados."));

        String matricula = limparTexto(usuarioRequestDTO.matricula());
        String email = limparTexto(usuarioRequestDTO.email());

        usuarioRepository.findByMatricula(matricula)
                .ifPresent(usuarioEncontrado -> {
                    if (!Objects.equals(usuarioEncontrado.getId(), id)) {
                        throw new ResponseStatusException(HttpStatus.CONFLICT,
                                "Já existe outro usuário cadastrado com essa matrícula");
                    }
                });

        if (email != null) {
            usuarioRepository.findByEmail(email)
                    .ifPresent(usuarioEncontrado -> {
                        if (!Objects.equals(usuarioEncontrado.getId(), id)) {
                            throw new ResponseStatusException(HttpStatus.CONFLICT,
                                    "Já existe outro usuário cadastrado com esse e-mail.");
                        }
                    });
        }

        preencherDadosUsuario(usuarioExistente, usuarioRequestDTO);

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

    private void preencherDadosUsuario(Usuario usuario, UsuarioRequestDTO usuarioRequestDTO){

        usuario.setMatricula(limparTexto(usuarioRequestDTO.matricula()));
        usuario.setNome(limparTexto(usuarioRequestDTO.nome()));
        usuario.setSenha(limparTexto(usuarioRequestDTO.senha()));
        usuario.setEmail(limparTexto(usuarioRequestDTO.email()));
        usuario.setPostGrad(limparTexto(usuarioRequestDTO.postgrad()));
        usuario.setSetor(limparTexto(usuarioRequestDTO.setor()));
        usuario.setNomeCompleto(limparTexto(usuarioRequestDTO.nomeCompleto()));
        usuario.setUnidade(limparTexto(usuarioRequestDTO.unidade()));

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
                usuario.getDataCadastro().atStartOfDay(),
                usuario.getDataModificacao()
        );
    }
    private String limparTexto(String texto){

        if (texto == null) {
            return null;
        }

        String textoTratado = texto.trim();

        if (textoTratado.isBlank()){
            return null;
        }

        return textoTratado;
    }
}
