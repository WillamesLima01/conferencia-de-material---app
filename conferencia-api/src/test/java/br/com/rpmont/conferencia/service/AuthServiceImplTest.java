package br.com.rpmont.conferencia.service;

import br.com.rpmont.conferencia.model.Usuario;
import br.com.rpmont.conferencia.dtos.LoginRequestDTO;
import br.com.rpmont.conferencia.repository.UsuarioRepository;
import br.com.rpmont.conferencia.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AuthServiceImplTest {
    private UsuarioRepository repository;
    private PasswordEncoder encoder;
    private JwtService jwt;
    private AuthServiceImpl service;
    private Usuario usuario;
    @BeforeEach void preparar() {
        repository = mock(UsuarioRepository.class); encoder = mock(PasswordEncoder.class);
        jwt = new JwtService();
        ReflectionTestUtils.setField(jwt, "jwtSecret", "chave-sintetica-auth04-012345678901234567890123456789");
        ReflectionTestUtils.setField(jwt, "jwtExpiration", 3600000L);
        service = new AuthServiceImpl(repository, jwt, encoder);
        usuario = new Usuario(); usuario.setId(1L); usuario.setMatricula("SINTETICO");
        usuario.setSenha("$2a$hash-ficticio"); usuario.setAtivo(true); usuario.setStatusAcesso("LIBERADO");
        when(repository.findByMatricula("SINTETICO")).thenReturn(Optional.of(usuario));
    }
    @Test void emissaoNaoMisturaSenhaVerificadaComVersaoMaisRecente() {
        when(encoder.matches("senha-sintetica", "$2a$hash-ficticio")).thenAnswer(i -> {
            usuario.trocarSenha("$2a$hash-alterado"); return true;
        });
        var resposta = service.login(new LoginRequestDTO("SINTETICO", "senha-sintetica"));
        assertEquals(0, jwt.validarIdentidade(resposta.token()).orElseThrow().credencialVersao());
        assertEquals(1, usuario.getCredencialVersao());
        verify(repository, times(1)).findByMatricula("SINTETICO");
        verifyNoMoreInteractions(repository);
    }
    @Test void loginAtualEmiteVersaoAtual() {
        usuario.setCredencialVersao(3L);
        when(encoder.matches("senha-sintetica", "$2a$hash-ficticio")).thenReturn(true);
        var resposta = service.login(new LoginRequestDTO("SINTETICO", "senha-sintetica"));
        assertEquals(3, jwt.validarIdentidade(resposta.token()).orElseThrow().credencialVersao());
        verify(repository, never()).save(any());
    }
    @Test void senhaIncorretaNaoEmite() {
        var spyJwt = spy(jwt);
        var auth = new AuthServiceImpl(repository, spyJwt, encoder);
        assertThrows(ResponseStatusException.class, () -> auth.login(new LoginRequestDTO("SINTETICO", "errada")));
        verify(spyJwt, never()).gerarToken(any(JwtService.DadosEmissao.class));
    }
}
