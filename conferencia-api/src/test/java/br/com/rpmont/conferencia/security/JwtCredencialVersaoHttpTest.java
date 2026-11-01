package br.com.rpmont.conferencia.security;

import br.com.rpmont.conferencia.config.SecurityConfig;
import br.com.rpmont.conferencia.controller.*;
import br.com.rpmont.conferencia.exception.GlobalExceptionHandler;
import br.com.rpmont.conferencia.model.*;
import br.com.rpmont.conferencia.repository.*;
import br.com.rpmont.conferencia.service.*;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.context.annotation.*;
import org.springframework.core.env.MapPropertySource;
import org.springframework.mock.web.MockServletContext;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.FilterChainProxy;
import org.springframework.test.web.servlet.*;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.support.AnnotationConfigWebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import org.springframework.http.MediaType;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Stream;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Cadeia e servicos reais; persistencia simulada. Atomicidade depende dos testes MySQL separados. */
class JwtCredencialVersaoHttpTest {
    private static final String CHAVE = "chave-http04-sintetica-exclusiva-01234567890123456789";
    private AnnotationConfigWebApplicationContext context;
    private MockMvc mvc;
    private UsuarioRepository repository;
    private JwtService jwt;
    private Usuario alvo, master;
    @Configuration(proxyBeanMethods = false) @EnableWebMvc @EnableWebSecurity
    @Import({SecurityConfig.class, JwtService.class, JwtAuthenticationFilter.class, AuthController.class,
            UsuarioController.class, UnidadeController.class, AuthServiceImpl.class, UsuarioServiceImpl.class,
            RecuperacaoSenhaServiceImpl.class, GlobalExceptionHandler.class})
    static class Configuracao {
        @Bean UsuarioRepository usuarios() { return mock(UsuarioRepository.class); }
        @Bean RecuperacaoSenhaRepository recuperacoes() { return mock(RecuperacaoSenhaRepository.class); }
        @Bean EmailService email() { return mock(EmailService.class); }
        @Bean UnidadeService unidades() { return mock(UnidadeService.class); }
    }
    @BeforeEach void preparar() {
        SecurityContextHolder.clearContext();
        context = new AnnotationConfigWebApplicationContext(); context.setServletContext(new MockServletContext());
        context.getEnvironment().getPropertySources().addFirst(new MapPropertySource("sintetico",
                Map.of("jwt.secret", CHAVE, "jwt.expiration", "3600000")));
        context.register(Configuracao.class); context.refresh();
        mvc = MockMvcBuilders.webAppContextSetup(context).addFilters(context.getBean(FilterChainProxy.class)).build();
        assertTrue(context.getBeansOfType(javax.sql.DataSource.class).isEmpty());
        assertTrue(context.getBeansOfType(jakarta.persistence.EntityManagerFactory.class).isEmpty());
        assertTrue(context.getBeansOfType(org.springframework.mail.javamail.JavaMailSender.class).isEmpty());
        repository = context.getBean(UsuarioRepository.class); jwt = context.getBean(JwtService.class);
        PasswordEncoder encoder = context.getBean(PasswordEncoder.class);
        master = usuario(1L, "MASTER-SINTETICO", 1, encoder);
        alvo = usuario(2L, "ALVO-SINTETICO", 3, encoder);
        when(repository.findByMatricula(master.getMatricula())).thenReturn(Optional.of(master));
        when(repository.findByMatricula(alvo.getMatricula())).thenReturn(Optional.of(alvo));
        when(repository.findByEmail(alvo.getEmail())).thenReturn(Optional.of(alvo));
        when(repository.findById(alvo.getId())).thenReturn(Optional.of(alvo));
        when(repository.buscarPorEmailComBloqueio(alvo.getEmail())).thenReturn(Optional.of(alvo));
        when(repository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(context.getBean(UnidadeService.class).listarTodas(any())).thenReturn(List.of());
        RecuperacaoSenha r = new RecuperacaoSenha(); r.setUsuario(alvo); r.setTentativas(0); r.setUtilizado(false);
        r.setCodigoHash(encoder.encode("482719")); r.setDataCriacao(LocalDateTime.now().minusMinutes(2));
        r.setDataExpiracao(LocalDateTime.now().plusMinutes(10));
        when(context.getBean(RecuperacaoSenhaRepository.class)
                .findTopByUsuarioAndUtilizadoFalseOrderByDataCriacaoDesc(alvo)).thenReturn(Optional.of(r));
    }
    private Usuario usuario(Long id, String matricula, int nivel, PasswordEncoder encoder) {
        Usuario u = new Usuario(); u.setId(id); u.setMatricula(matricula); u.setNivel(nivel);
        u.setNome("Sintetico"); u.setNomeCompleto("Nome sintetico");
        u.setEmail(matricula.toLowerCase(Locale.ROOT) + "@example.invalid");
        u.setSenha(encoder.encode("senha-antiga-sintetica")); u.setAtivo(true); u.setStatusAcesso("LIBERADO");
        u.setSetor("P4"); u.setUnidade("TESTE"); return u;
    }
    @AfterEach void limpar() { if (context != null) context.close(); SecurityContextHolder.clearContext(); }
    private void acesso(String token, int status) throws Exception {
        var resultado = mvc.perform(get("/unidades").header("Authorization", "Bearer " + token))
                .andExpect(status().is(status)).andReturn();
        String resposta = resultado.getResponse().getContentAsString();
        assertFalse(resposta.contains(token), "JWT nao deve ser reproduzido.");
        assertFalse(resposta.contains(alvo.getSenha()), "Hash nao deve ser reproduzido.");
        if (status == 403) assertNull(resultado.getHandler());
    }
    @ParameterizedTest @ValueSource(strings = {"administrativa", "recuperacao"})
    void trocaRealDeServicoRevogaENovoLoginFunciona(String origem) throws Exception {
        String antigo = jwt.gerarToken(alvo); acesso(antigo, 200);
        String resposta;
        if (origem.equals("administrativa")) {
            resposta = mvc.perform(put("/usuario/2").header("Authorization", "Bearer " + jwt.gerarToken(master))
                    .contentType(MediaType.APPLICATION_JSON).content("{\"matricula\":\"ALVO-SINTETICO\",\"nome\":\"Sintetico\","
                            + "\"senha\":\"senha-nova-sintetica\",\"email\":\"alvo-sintetico@example.invalid\","
                            + "\"nivel\":3,\"setor\":\"P4\",\"unidade\":\"TESTE\",\"statusAcesso\":\"LIBERADO\"}"))
                    .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        } else {
            resposta = mvc.perform(post("/auth/recuperar-senha/redefinir").contentType(MediaType.APPLICATION_JSON)
                    .content("{\"email\":\"alvo-sintetico@example.invalid\",\"codigo\":\"482719\","
                            + "\"novaSenha\":\"senha-nova-sintetica\",\"confirmarSenha\":\"senha-nova-sintetica\"}"))
                    .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        }
        assertEquals(1L, alvo.getCredencialVersao()); acesso(antigo, 403);
        assertFalse(resposta.contains("credencialVersao")); assertFalse(resposta.contains("versaoRegistro"));
        var login = mvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"matricula\":\"ALVO-SINTETICO\",\"senha\":\"senha-nova-sintetica\"}"))
                .andExpect(status().isOk()).andReturn();
        String novo = com.jayway.jsonpath.JsonPath.read(login.getResponse().getContentAsString(), "$.token");
        acesso(novo, 200);
        mvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"matricula\":\"ALVO-SINTETICO\",\"senha\":\"senha-antiga-sintetica\"}"))
                .andExpect(status().isUnauthorized());
    }
    private String assinar(Object versao, long id) {
        return Jwts.builder().subject(alvo.getMatricula()).claim("id", id).claim("credencialVersao", versao)
                .issuedAt(new Date(1000)).expiration(new Date(System.currentTimeMillis() + 60000))
                .signWith(Keys.hmacShaKeyFor(CHAVE.getBytes(StandardCharsets.UTF_8))).compact();
    }
    static Stream<Object> invalidos() { return Stream.of(null, "0", 0.5, -1L, true); }
    @ParameterizedTest @MethodSource("invalidos")
    void claimAusenteOuInvalidoNaoConsultaRepositorio(Object versao) throws Exception {
        acesso(assinar(versao, 2L), 403); verifyNoInteractions(repository);
    }
    @Test void idDivergenteNaoAutenticaContaRecriada() throws Exception { acesso(assinar(0, 99L), 403); }
    @Test void trocasNoMesmoSegundoContinuamDistintas() throws Exception {
        String v0 = assinar(0, 2L); alvo.trocarSenha("hash-sintetico-1");
        String v1 = assinar(1, 2L); alvo.trocarSenha("hash-sintetico-2");
        acesso(v0, 403); acesso(v1, 403); acesso(assinar(2, 2L), 200);
    }
    @Test void versoesNaoIntegramDTOsPublicos() {
        for (Class<?> dto : List.of(br.com.rpmont.conferencia.dtos.UsuarioAdminRequestDTO.class,
                br.com.rpmont.conferencia.dtos.UsuarioRequestDTO.class, br.com.rpmont.conferencia.dtos.UsuarioResponseDTO.class,
                br.com.rpmont.conferencia.dtos.LoginResponseDTO.class)) {
            for (var campo : dto.getRecordComponents()) {
                assertFalse(Set.of("credencialVersao", "versaoRegistro").contains(campo.getName()));
            }
        }
    }
}
