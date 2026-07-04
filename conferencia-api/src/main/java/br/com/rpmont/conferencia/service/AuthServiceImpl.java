package br.com.rpmont.conferencia.service;

import br.com.rpmont.conferencia.dtos.LoginRequestDTO;
import br.com.rpmont.conferencia.dtos.LoginResponseDTO;
import br.com.rpmont.conferencia.enums.StatusAcessoUsuario;
import br.com.rpmont.conferencia.model.Usuario;
import br.com.rpmont.conferencia.repository.UsuarioRepository;
import br.com.rpmont.conferencia.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@RequiredArgsConstructor
@Service
public class AuthServiceImpl implements AuthService {

    private final UsuarioRepository usuarioRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    @Override
    public LoginResponseDTO login(LoginRequestDTO loginRequestDTO) {

        String matricula = limparTexto(loginRequestDTO.matricula());
        String senha = limparTexto(loginRequestDTO.senha());

        Usuario usuario = usuarioRepository.findByMatricula(matricula)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Matrícula ou senha inválida."
                ));

        if (!senhaValida(senha, usuario.getSenha())) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Matrícula ou senha inválida."
            );
        }

        if (!StatusAcessoUsuario.LIBERADO.name().equalsIgnoreCase(usuario.getStatusAcesso())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Usuário sem acesso liberado ao sistema."
            );
        }

        if (usuario.getAtivo() == null || usuario.getAtivo() != 1) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Usuário inativo no sistema."
            );
        }

        String token = jwtService.gerarToken(usuario);

        return new LoginResponseDTO(
                token,
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
                usuario.getAtivo()
        );
    }

    private boolean senhaValida(String senhaDigitada, String senhaBanco) {

        if (senhaDigitada == null || senhaBanco == null) {
            return false;
        }

        if (senhaBanco.startsWith("$2a$") || senhaBanco.startsWith("$2b$") || senhaBanco.startsWith("$2y$")) {
            return passwordEncoder.matches(senhaDigitada, senhaBanco);
        }

        return senhaDigitada.equals(senhaBanco);
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