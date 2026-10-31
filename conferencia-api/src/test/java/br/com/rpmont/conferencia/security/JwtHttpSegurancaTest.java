package br.com.rpmont.conferencia.security;

import br.com.rpmont.conferencia.config.SecurityConfig;
import br.com.rpmont.conferencia.controller.UnidadeController;
import br.com.rpmont.conferencia.controller.UsuarioController;
import br.com.rpmont.conferencia.model.Usuario;
import br.com.rpmont.conferencia.repository.UsuarioRepository;
import br.com.rpmont.conferencia.service.UnidadeService;
import br.com.rpmont.conferencia.service.UsuarioService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.mock.web.MockServletContext;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.FilterChainProxy;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.support.AnnotationConfigWebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class JwtHttpSegurancaTest {
    private static final String SECRET = "segredo-exclusivamente-sintetico-jwt-testes-0123456789";
    private static final String MATRICULA = "JWT-HTTP-SINTETICO";
    private static final String PRIVADO = "DADO_PROTEGIDO_SINTETICO";
    private AnnotationConfigWebApplicationContext context;
    private MockMvc mvc;
    private UsuarioRepository repository;
    private UsuarioService usuarios;
    private UnidadeService unidades;
    private UsuarioController usuarioController;
    private UnidadeController unidadeController;
    private JwtService jwt;

    // Contexto Spring explicito: sem Boot, component scan, application.properties,
    // persistencia, DataSource, SMTP ou carregamento de configuracoes locais.
    @Configuration(proxyBeanMethods = false)
    @EnableWebMvc
    @EnableWebSecurity
    @Import(SecurityConfig.class)
    static class Configuracao {
        @Bean UsuarioRepository repository() { return mock(UsuarioRepository.class); }
        @Bean UsuarioService usuarios() { return mock(UsuarioService.class); }
        @Bean UnidadeService unidades() { return mock(UnidadeService.class); }
        @Bean JwtService jwt() {
            JwtService jwt = new JwtService();
            ReflectionTestUtils.setField(jwt, "jwtSecret", SECRET);
            ReflectionTestUtils.setField(jwt, "jwtExpiration", 3600000L);
            return jwt;
        }
        @Bean JwtAuthenticationFilter filtro(JwtService jwt, UsuarioRepository repository) {
            return new JwtAuthenticationFilter(jwt, repository);
        }
        @Bean UsuarioController usuarioController(UsuarioService service) {
            return spy(new UsuarioController(service));
        }
        @Bean UnidadeController unidadeController(UnidadeService service) {
            return spy(new UnidadeController(service));
        }
    }
    @BeforeEach void preparar() {
        SecurityContextHolder.clearContext();
        context = new AnnotationConfigWebApplicationContext();
        context.setServletContext(new MockServletContext());
        context.getEnvironment().getPropertySources().addFirst(
                new org.springframework.core.env.MapPropertySource("jwt-sintetico", java.util.Map.of(
                        "jwt.secret", SECRET, "jwt.expiration", "3600000")));
        context.register(Configuracao.class);
        context.refresh();
        repository = context.getBean(UsuarioRepository.class);
        usuarios = context.getBean(UsuarioService.class);
        unidades = context.getBean(UnidadeService.class);
        usuarioController = context.getBean(UsuarioController.class);
        unidadeController = context.getBean(UnidadeController.class);
        jwt = context.getBean(JwtService.class);
        mvc = MockMvcBuilders.webAppContextSetup(context)
                .addFilters(context.getBean(FilterChainProxy.class)).build();
        when(usuarios.listarTodosUsuario()).thenReturn(List.of());
        when(unidades.listarTodas(any())).thenReturn(List.of());
        limparInvocacoes();
        assertTrue(context.getBeansOfType(javax.sql.DataSource.class).isEmpty());
        assertTrue(context.getBeansOfType(jakarta.persistence.EntityManagerFactory.class).isEmpty());
        assertTrue(context.getBeansOfType(org.springframework.mail.javamail.JavaMailSender.class).isEmpty());
    }
    @AfterEach void limpar() {
        if (context != null) context.close();
        SecurityContextHolder.clearContext();
    }
    private void limparInvocacoes() {
        clearInvocations(usuarios, unidades, usuarioController, unidadeController);
    }
    private Usuario usuario(int nivel) {
        Usuario usuario = new Usuario();
        usuario.setId(91L);
        usuario.setMatricula(MATRICULA);
        usuario.setNome(PRIVADO);
        usuario.setSenha(PRIVADO);
        usuario.setNivel(nivel);
        usuario.setAtivo(true);
        usuario.setStatusAcesso("LIBERADO");
        return usuario;
    }
    private void encontrado(Usuario usuario) {
        when(repository.findByMatricula(MATRICULA)).thenReturn(Optional.of(usuario));
    }
    private void autorizado(String rota, String token) throws Exception {
        mvc.perform(get(rota).header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andExpect(content().json("[]"));
        if (rota.equals("/usuario")) {
            verify(usuarioController).listarTodosUsuario();
            verify(usuarios).listarTodosUsuario();
        } else {
            verify(unidadeController).listarTodas(any());
            verify(unidades).listarTodas(any());
        }
        limparInvocacoes();
    }
    private void negado(String rota, String token) throws Exception {
        limparInvocacoes();
        var request = get(rota);
        if (token != null) request.header("Authorization", "Bearer " + token);
        MvcResult result = mvc.perform(request).andExpect(status().isForbidden()).andReturn();
        assertNull(result.getHandler(), "Negacao deve ocorrer antes do controller");
        verifyNoInteractions(usuarioController, unidadeController, usuarios, unidades);
        String resposta = result.getResponse().getContentAsString() + result.getResponse().getHeaderNames().stream()
                .map(nome -> result.getResponse().getHeaders(nome).toString()).reduce("", String::concat)
                + String.valueOf(result.getResponse().getErrorMessage());
        for (String proibido : List.of(PRIVADO, MATRICULA, SECRET, "java.lang.", "org.hibernate",
                "jdbc:mysql:", "stackTrace")) {
            assertFalse(resposta.contains(proibido), "Resposta nao deve conter dados protegidos");
        }
        if (token != null) assertFalse(resposta.contains(token), "Resposta nao deve reproduzir JWT");
    }
    static Stream<Arguments> rotasENiveis() {
        return Stream.of("/usuario", "/unidades").flatMap(rota -> Stream.of(1, 2)
                .map(nivel -> Arguments.of(rota, nivel)));
    }
    @ParameterizedTest @MethodSource("rotasENiveis")
    void mesmoJwtAntesDepoisDoBloqueioEDesbloqueio(String rota, int nivel) throws Exception {
        Usuario usuario = usuario(nivel);
        encontrado(usuario);
        String token = jwt.gerarToken(usuario);
        autorizado(rota, token);
        usuario.setStatusAcesso("BLOQUEADO");
        negado(rota, token);
        usuario.setStatusAcesso("LIBERADO");
        autorizado(rota, token);
        verify(repository, times(3)).findByMatricula(MATRICULA);
    }
    @ParameterizedTest @MethodSource("rotasENiveis")
    void mesmoJwtAntesDepoisDaInativacaoEReativacao(String rota, int nivel) throws Exception {
        Usuario usuario = usuario(nivel);
        encontrado(usuario);
        String token = jwt.gerarToken(usuario);
        autorizado(rota, token);
        usuario.setAtivo(false);
        negado(rota, token);
        usuario.setAtivo(true);
        autorizado(rota, token);
    }
    @ParameterizedTest @MethodSource("rotasENiveis")
    void mesmoJwtAntesDepoisDaRemocao(String rota, int nivel) throws Exception {
        Usuario usuario = usuario(nivel);
        encontrado(usuario);
        String token = jwt.gerarToken(usuario);
        autorizado(rota, token);
        when(repository.findByMatricula(MATRICULA)).thenReturn(Optional.empty());
        negado(rota, token);
    }
    static Stream<Arguments> estadosNegados() {
        return rotasENiveis().flatMap(args -> {
            Object[] valores = args.get();
            return Stream.of(new Object[]{false, "LIBERADO"}, new Object[]{null, "LIBERADO"},
                    new Object[]{true, null}, new Object[]{true, "BLOQUEADO"},
                    new Object[]{true, "PENDENTE"}, new Object[]{true, ""},
                    new Object[]{true, "DESCONHECIDO"}, new Object[]{true, " LIBERADO "})
                    .map(estado -> Arguments.of(valores[0], valores[1], estado[0], estado[1]));
        });
    }
    @ParameterizedTest @MethodSource("estadosNegados")
    void estadoAtualNaoAutorizadoNegaMesmoComClaimsLiberados(String rota, int nivel,
                                                            Boolean ativo, String status) throws Exception {
        Usuario usuario = usuario(nivel);
        String token = jwt.gerarToken(usuario);
        usuario.setAtivo(ativo);
        usuario.setStatusAcesso(status);
        encontrado(usuario);
        negado(rota, token);
    }
    static Stream<Arguments> autorizados() {
        return rotasENiveis().flatMap(args -> Stream.of("LIBERADO", "liberado", "LiBeRaDo")
                .map(status -> Arguments.of(args.get()[0], args.get()[1], status)));
    }
    @ParameterizedTest @MethodSource("autorizados")
    void usuarioAtivoLiberadoAcessa(String rota, int nivel, String status) throws Exception {
        Usuario usuario = usuario(nivel);
        usuario.setStatusAcesso(status);
        encontrado(usuario);
        autorizado(rota, jwt.gerarToken(usuario));
    }
    static Stream<Arguments> tokensNegados() {
        return Stream.of("/usuario", "/unidades").flatMap(rota -> Stream.of("ausente", "invalido", "assinatura", "expirado")
                .map(tipo -> Arguments.of(rota, tipo)));
    }
    @ParameterizedTest @MethodSource("tokensNegados")
    void tokenAusenteInvalidoOuExpiradoNaoConsultaBanco(String rota, String tipo) throws Exception {
        String token = null;
        if (tipo.equals("invalido")) token = "JWT_INVALIDO_SINTETICO";
        if (tipo.equals("expirado")) {
            ReflectionTestUtils.setField(jwt, "jwtExpiration", -60000L);
            token = jwt.gerarToken(usuario(1));
        }
        if (tipo.equals("assinatura")) {
            JwtService outro = new JwtService();
            ReflectionTestUtils.setField(outro, "jwtSecret", "outra-chave-sintetica-exclusiva-01234567890123456789");
            ReflectionTestUtils.setField(outro, "jwtExpiration", 3600000L);
            token = outro.gerarToken(usuario(1));
        }
        negado(rota, token);
        verifyNoInteractions(repository);
    }
}
