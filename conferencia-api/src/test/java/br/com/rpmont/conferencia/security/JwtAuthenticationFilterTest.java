package br.com.rpmont.conferencia.security;

import br.com.rpmont.conferencia.model.Usuario;
import br.com.rpmont.conferencia.repository.UsuarioRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import jakarta.servlet.FilterChain;
import java.util.Optional;
import java.util.stream.Stream;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class JwtAuthenticationFilterTest {
    private JwtService jwt;
    private UsuarioRepository repository;
    private JwtAuthenticationFilter filter;
    private static final String TOKEN = "token-sintetico";

    @BeforeEach void preparar() {
        SecurityContextHolder.clearContext();
        jwt = mock(JwtService.class);
        repository = mock(UsuarioRepository.class);
        filter = new JwtAuthenticationFilter(jwt, repository);
    }
    @AfterEach void limpar() { SecurityContextHolder.clearContext(); }

    private Usuario usuario(int nivel, Boolean ativo, String status) {
        Usuario usuario = new Usuario();
        usuario.setId(1L);
        usuario.setMatricula("JWT-SINTETICO");
        usuario.setNivel(nivel);
        usuario.setAtivo(ativo);
        usuario.setStatusAcesso(status);
        return usuario;
    }
    private void tokenValido() {
        when(jwt.validarIdentidade(TOKEN)).thenReturn(Optional.of(
                new JwtService.Identidade(1L, "JWT-SINTETICO", 0L)));
    }
    private void requisitar(String authorization) throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/usuario");
        if (authorization != null) request.addHeader("Authorization", authorization);
        FilterChain chain = mock(FilterChain.class);
        MockHttpServletResponse response = new MockHttpServletResponse();
        filter.doFilter(request, response, chain);
        verify(chain).doFilter(request, response);
    }
    static Stream<Arguments> estadosNegados() {
        return Stream.of(1, 2, 3).flatMap(nivel -> Stream.of(
                Arguments.of(nivel, false, "LIBERADO"),
                Arguments.of(nivel, null, "LIBERADO"),
                Arguments.of(nivel, true, null),
                Arguments.of(nivel, true, "BLOQUEADO"),
                Arguments.of(nivel, true, "PENDENTE"),
                Arguments.of(nivel, true, ""),
                Arguments.of(nivel, true, "DESCONHECIDO"),
                Arguments.of(nivel, true, " LIBERADO ")));
    }
    @ParameterizedTest @MethodSource("estadosNegados")
    void estadoNaoAutorizadoLimpaContexto(int nivel, Boolean ativo, String status) throws Exception {
        tokenValido();
        when(repository.findByMatricula("JWT-SINTETICO")).thenReturn(Optional.of(usuario(nivel, ativo, status)));
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("anterior", null, java.util.List.of()));
        requisitar("Bearer " + TOKEN);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }
    static Stream<Arguments> autorizados() {
        return Stream.of(1, 2, 3).flatMap(nivel -> Stream.of("LIBERADO", "liberado", "LiBeRaDo")
                .map(status -> Arguments.of(nivel, status)));
    }
    @ParameterizedTest @MethodSource("autorizados")
    void ativoLiberadoAutenticaComRoleAtual(int nivel, String status) throws Exception {
        tokenValido();
        Usuario usuario = usuario(nivel, true, status);
        when(repository.findByMatricula(usuario.getMatricula())).thenReturn(Optional.of(usuario));
        requisitar("Bearer " + TOKEN);
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        assertNotNull(authentication);
        assertTrue(authentication.isAuthenticated());
        assertSame(usuario, authentication.getPrincipal());
        String role = nivel == 1 ? "ROLE_ADMIN_MASTER" : nivel == 2 ? "ROLE_ADMIN" : "ROLE_USUARIO_COMUM";
        assertEquals(java.util.List.of(role), authentication.getAuthorities().stream().map(Object::toString).toList());
    }
    @Test void usuarioRemovidoNaoAutentica() throws Exception {
        tokenValido();
        when(repository.findByMatricula("JWT-SINTETICO")).thenReturn(Optional.empty());
        requisitar("Bearer " + TOKEN);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }
    @ParameterizedTest @ValueSource(strings = {"invalido", "expirado"})
    void tokenRejeitadoNaoConsultaUsuario(String token) throws Exception {
        when(jwt.validarIdentidade(token)).thenReturn(Optional.empty());
        requisitar("Bearer " + token);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verifyNoInteractions(repository);
        verify(jwt, never()).extrairMatricula(anyString());
    }
    @ParameterizedTest @ValueSource(strings = {"id", "matricula", "versao", "nula"})
    void identidadeOuVersaoDivergenteNaoAutentica(String divergencia) throws Exception {
        tokenValido();
        Usuario u = usuario(1, true, "LIBERADO");
        switch (divergencia) {
            case "id" -> u.setId(2L);
            case "matricula" -> u.setMatricula("OUTRA-CONTA");
            case "versao" -> u.setCredencialVersao(1L);
            default -> u.setCredencialVersao(null);
        }
        when(repository.findByMatricula("JWT-SINTETICO")).thenReturn(Optional.of(u));
        requisitar("Bearer " + TOKEN);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }
    @Test void semBearerNaoConsultaJwtOuUsuario() throws Exception {
        requisitar(null);
        requisitar("Basic sintetico");
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verifyNoInteractions(jwt, repository);
    }
}
