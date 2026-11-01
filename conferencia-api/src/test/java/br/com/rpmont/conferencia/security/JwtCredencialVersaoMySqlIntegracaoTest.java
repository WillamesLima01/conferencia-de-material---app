package br.com.rpmont.conferencia.security;

import br.com.rpmont.conferencia.model.*;
import br.com.rpmont.conferencia.repository.*;
import br.com.rpmont.conferencia.service.*;
import br.com.rpmont.conferencia.dtos.*;
import br.com.rpmont.conferencia.support.PatrimonioHomologacaoFixture;
import br.com.rpmont.conferencia.config.SecurityConfig;
import br.com.rpmont.conferencia.controller.AuthController;
import br.com.rpmont.conferencia.controller.UnidadeController;
import br.com.rpmont.conferencia.exception.GlobalExceptionHandler;
import jakarta.persistence.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.parallel.Execution;
import org.junit.jupiter.api.parallel.ExecutionMode;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringBootConfiguration;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.annotation.*;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.orm.jpa.persistenceunit.PersistenceManagedTypes;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.FilterChainProxy;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.web.server.ResponseStatusException;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.function.Supplier;
import java.nio.charset.StandardCharsets;
import javax.sql.DataSource;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Validacao MySQL local concluida em 01/11/2026: nove cenarios aprovados.
 * Migracao 002 autorizada/aplicada separadamente na homologacao local.
 * Nao selecionar esta classe nas execucoes sem banco. */
@SpringBootTest(classes = JwtCredencialVersaoMySqlIntegracaoTest.Configuracao.class,
        webEnvironment = SpringBootTest.WebEnvironment.MOCK, properties = {
        "spring.config.location=classpath:/application-homolog.properties", "spring.profiles.include=",
        "spring.datasource.url=" + PatrimonioHomologacaoFixture.URL,
        "spring.jpa.hibernate.ddl-auto=validate", "spring.main.web-application-type=servlet",
        "spring.jpa.show-sql=false", "spring.jpa.properties.hibernate.cache.use_second_level_cache=false",
        "logging.level.org.springframework.web=INFO"})
@ActiveProfiles("homolog")
@ContextConfiguration(initializers = JwtCredencialVersaoMySqlIntegracaoTest.DestinoLocal.class)
@Execution(ExecutionMode.SAME_THREAD)
class JwtCredencialVersaoMySqlIntegracaoTest {
    public static class DestinoLocal extends PatrimonioHomologacaoFixture.DestinoLocal {
        @Override public void initialize(ConfigurableApplicationContext c) {
            super.initialize(c);
            if (!"rpmont_teste".equals(c.getEnvironment().getProperty("spring.datasource.username")))
                throw new IllegalStateException("Usuario de homologacao nao autorizado.");
        }
    }
    @SpringBootConfiguration @EnableAutoConfiguration
    @EnableJpaRepositories(basePackages = "br.com.rpmont.conferencia.repository",
            includeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE,
                    classes = {UsuarioRepository.class, RecuperacaoSenhaRepository.class}))
    @Import({UsuarioServiceImpl.class, RecuperacaoSenhaServiceImpl.class, AuthServiceImpl.class, JwtService.class,
            SecurityConfig.class, JwtAuthenticationFilter.class, AuthController.class, GlobalExceptionHandler.class})
    static class Configuracao {
        @Bean DataSource dataSource(org.springframework.core.env.Environment env) throws Exception {
            // URL fixa: nao permitir redirecionamento por propriedades especificas de pool.
            var ds = new org.springframework.jdbc.datasource.DriverManagerDataSource(
                    PatrimonioHomologacaoFixture.URL, "rpmont_teste",
                    env.getRequiredProperty("spring.datasource.password"));
            ds.setDriverClassName("com.mysql.cj.jdbc.Driver");
            // Bean criado antes da EntityManagerFactory; somente metadados.
            try (var c = ds.getConnection()) {
                if (!PatrimonioHomologacaoFixture.URL.equals(c.getMetaData().getURL())
                        || !"rpmont_homologacao".equals(c.getCatalog()))
                    throw new IllegalStateException("Conexao fora da homologacao autorizada.");
            }
            return ds;
        }
        @Bean PersistenceManagedTypes tipos() {
            return PersistenceManagedTypes.of(Usuario.class.getName(), RecuperacaoSenha.class.getName());
        }
        // PasswordEncoder real fornecido por SecurityConfig; nao duplicar o bean.
        @Bean UnidadeService unidades() { return mock(UnidadeService.class); }
        @Bean UnidadeController unidadeController(UnidadeService unidades) {
            return spy(new UnidadeController(unidades));
        }
        @Bean org.springframework.security.core.userdetails.UserDetailsService semLoginDeDesenvolvimento() {
            // Impede a autoconfiguracao de gerar/logar uma senha de desenvolvimento.
            return nome -> { throw new org.springframework.security.core.userdetails.UsernameNotFoundException(
                    "Autenticacao exclusivamente JWT neste contexto de teste."); };
        }
        @Bean EmailService email() { return mock(EmailService.class); }
    }
    @MockitoSpyBean private UsuarioRepository usuarios;
    @MockitoSpyBean private RecuperacaoSenhaRepository recuperacoes;
    @MockitoSpyBean private PasswordEncoder encoder;
    @Autowired private UsuarioService usuarioService;
    @Autowired private RecuperacaoSenhaService recuperacaoService;
    @Autowired private AuthService auth;
    @Autowired private JwtService jwt;
    @Autowired private PlatformTransactionManager manager;
    @Autowired private DataSource dataSource;
    @Autowired private WebApplicationContext webContext;
    @Autowired private FilterChainProxy cadeiaSeguranca;
    @Autowired private UnidadeService unidades;
    @Autowired private UnidadeController unidadeController;
    private MockMvc mvc;
    @PersistenceContext private EntityManager em;
    private final List<Long> idsUsuarios = new ArrayList<>(), idsCodigos = new ArrayList<>();
    private final String marca = UUID.randomUUID().toString().replace("-", "").substring(0, 20);
    private Usuario master, alvo;
    private Long codigoId;
    private boolean workersEncerrados = true;
    private TransactionTemplate tx() { return new TransactionTemplate(manager); }
    @BeforeEach void preparar() throws Exception {
        assertTrue(org.springframework.aop.support.AopUtils.isAopProxy(usuarioService));
        assertTrue(org.springframework.aop.support.AopUtils.isAopProxy(recuperacaoService));
        assertFalse(mockingDetails(usuarioService).isMock());
        assertFalse(mockingDetails(auth).isMock());
        mvc = MockMvcBuilders.webAppContextSetup(webContext).addFilters(cadeiaSeguranca).build();
        when(unidades.listarTodas(any())).thenReturn(List.of());
        try (var c = dataSource.getConnection()) {
            assertTrue(PatrimonioHomologacaoFixture.URL.equals(c.getMetaData().getURL()));
            assertTrue("rpmont_homologacao".equals(c.getCatalog()));
        }
        master = criar("m", 1); alvo = criar("a", 3);
        codigoId = tx().execute(status -> {
            RecuperacaoSenha r = new RecuperacaoSenha(); r.setUsuario(em.find(Usuario.class, alvo.getId()));
            r.setCodigoHash(encoder.encode("482719")); r.setTentativas(0); r.setUtilizado(false);
            r.setDataCriacao(LocalDateTime.now().minusMinutes(2)); r.setDataExpiracao(LocalDateTime.now().plusMinutes(10));
            em.persist(r); idsCodigos.add(r.getId()); em.flush(); return r.getId();
        });
        autenticarMaster();
    }
    private Usuario criar(String tipo, int nivel) {
        return tx().execute(status -> {
            Usuario u = new Usuario(); u.setMatricula("cv04-" + tipo + marca);
            u.setEmail(tipo + marca + "@example.invalid"); u.setNome("Sintetico"); u.setNomeCompleto("Fixture Achado 04");
            u.setNivel(nivel); u.setAtivo(true); u.setStatusAcesso("LIBERADO"); u.setSetor("P4"); u.setUnidade("TESTE-" + marca);
            u.setSenha(encoder.encode("senha-antiga")); u.setDataCadastro(LocalDate.now()); u.setDataModificacao(LocalDateTime.now());
            em.persist(u); idsUsuarios.add(u.getId()); em.flush();
            assertEquals(0L, u.getCredencialVersao()); assertNotNull(u.getVersaoRegistro()); return u;
        });
    }
    private void autenticarMaster() {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(master, null, List.of()));
    }
    private UsuarioAdminRequestDTO dto(String senha) {
        return new UsuarioAdminRequestDTO(alvo.getMatricula(), "Sintetico", senha, alvo.getEmail(), 3,
                null, "P4", "Fixture Achado 04", alvo.getUnidade(), "LIBERADO");
    }
    private void redefinir() {
        recuperacaoService.redefinirSenha(new RedefinirSenhaRequestDTO(alvo.getEmail(), "482719", "senha-nova", "senha-nova"));
    }
    private Estado estado() {
        return tx().execute(status -> {
            em.clear(); Usuario u = em.find(Usuario.class, alvo.getId()); RecuperacaoSenha r = em.find(RecuperacaoSenha.class, codigoId);
            return new Estado(u.getSenha(), u.getCredencialVersao(), u.getVersaoRegistro(), r.getUtilizado(), r.getTentativas());
        });
    }
    private record Estado(String hash, Long credencial, Long registro, Boolean usado, Integer tentativas) { }

    private String loginHttp(String senhaSintetica) throws Exception {
        assertFalse(TransactionSynchronizationManager.isActualTransactionActive(),
                "HTTP deve executar fora das transacoes da fixture.");
        SecurityContextHolder.clearContext();
        var resultado = mvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"matricula\":\"" + alvo.getMatricula() + "\",\"senha\":\"" + senhaSintetica + "\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.credencialVersao").doesNotExist())
                .andExpect(jsonPath("$.versaoRegistro").doesNotExist()).andReturn();
        return com.jayway.jsonpath.JsonPath.read(
                resultado.getResponse().getContentAsString(StandardCharsets.UTF_8), "$.token");
    }

    private void verificarAcessoHttp(String token, int esperado) throws Exception {
        assertFalse(TransactionSynchronizationManager.isActualTransactionActive());
        // Nunca reutilizar o principal administrativo preparado para chamadas diretas.
        SecurityContextHolder.clearContext();
        clearInvocations(usuarios, unidades, unidadeController);
        var resultado = mvc.perform(get("/unidades").header("Authorization", "Bearer " + token))
                .andExpect(status().is(esperado)).andReturn();
        verify(usuarios).findByMatricula(alvo.getMatricula());
        if (esperado == 200) {
            verify(unidadeController).listarTodas(any());
            var principal = org.mockito.ArgumentCaptor.forClass(Usuario.class);
            verify(unidades).listarTodas(principal.capture());
            assertEquals(alvo.getId(), principal.getValue().getId());
            assertEquals(estado().credencial(), principal.getValue().getCredencialVersao(),
                    "O filtro deve autenticar a versao efetivamente persistida.");
        } else {
            assertEquals(403, esperado);
            assertNull(resultado.getHandler(), "JWT revogado nao deve chegar ao controller.");
            verifyNoInteractions(unidadeController, unidades);
        }
        String resposta = resultado.getResponse().getContentAsString(StandardCharsets.UTF_8)
                + String.valueOf(resultado.getResponse().getErrorMessage())
                + resultado.getResponse().getHeaderNames().stream()
                .map(nome -> resultado.getResponse().getHeaders(nome).toString()).reduce("", String::concat);
        for (String proibido : List.of(token, alvo.getSenha(), "jdbc:mysql:", "java.lang.", "org.hibernate", "stackTrace")) {
            assertFalse(resposta.contains(proibido), "Resposta HTTP nao deve expor dados protegidos.");
        }
    }

    @ParameterizedTest @ValueSource(strings = {"administrativa", "recuperacao"})
    void trocaConfirmaVersaoENovoLogin(String origem) throws Exception {
        String token = loginHttp("senha-antiga");
        verificarAcessoHttp(token, 200);
        if (origem.equals("administrativa")) {
            autenticarMaster();
            usuarioService.atualizarUsuarioPorId(alvo.getId(), dto("senha-nova"));
        }
        else redefinir();
        Estado depois = estado(); assertEquals(1L, depois.credencial());
        assertEquals(origem.equals("recuperacao"), depois.usado());
        assertFalse(jwt.validarIdentidade(token).orElseThrow().credencialVersao() == depois.credencial());
        verificarAcessoHttp(token, 403);
        String novo = loginHttp("senha-nova");
        assertEquals(1L, jwt.validarIdentidade(novo).orElseThrow().credencialVersao());
        verificarAcessoHttp(novo, 200);
        assertThrows(ResponseStatusException.class, () -> auth.login(new LoginRequestDTO(alvo.getMatricula(), "senha-antiga")));
    }
    @Test void falhaAposFlushReverteSenhaVersoesECodigo() {
        Estado antes = estado();
        doAnswer(i -> {
            Object resultado = mockingDetails(recuperacoes).getMockCreationSettings().getDefaultAnswer().answer(i);
            RecuperacaoSenha r = i.getArgument(0);
            if (codigoId.equals(r.getId()) && Boolean.TRUE.equals(r.getUtilizado())) {
                em.flush();
                Number confirmadoNaTransacao = (Number) em.createNativeQuery(
                        "SELECT COUNT(*) FROM usuarios_sistema WHERE ID=:id AND credencialVersao=1")
                        .setParameter("id", alvo.getId()).getSingleResult();
                assertEquals(1, confirmadoNaTransacao.intValue());
                Number consumoNaTransacao = (Number) em.createNativeQuery(
                        "SELECT COUNT(*) FROM recuperacao_senha WHERE id=:id AND utilizado=true")
                        .setParameter("id", codigoId).getSingleResult();
                assertEquals(1, consumoNaTransacao.intValue());
                throw new IllegalStateException("Falha sintetica apos flush.");
            }
            return resultado;
        }).when(recuperacoes).save(any());
        try { assertThrows(IllegalStateException.class, this::redefinir); }
        finally { reset(recuperacoes); }
        assertTrue(antes.equals(estado()), "Rollback integral de senha, versoes e codigo.");
    }
    @ParameterizedTest @ValueSource(strings = {"senha", "perfil", "status", "nivel"})
    void gravacoesDaMesmaVersaoNaoSobrescrevemCredencial(String concorrente) throws Exception {
        CountDownLatch leituras = new CountDownLatch(2), liberar = new CountDownLatch(1);
        Set<Object> contextos = ConcurrentHashMap.newKeySet();
        doAnswer(i -> {
            assertTrue(org.springframework.transaction.support.TransactionSynchronizationManager.isActualTransactionActive());
            Object resultado = mockingDetails(usuarios).getMockCreationSettings().getDefaultAnswer().answer(i);
            contextos.add(em.getDelegate());
            leituras.countDown(); aguardar(liberar); return resultado;
        }).when(usuarios).findById(alvo.getId());
        ExecutorService pool = Executors.newFixedThreadPool(2); workersEncerrados = false;
        List<String> resultados;
        try {
            Future<String> a = pool.submit(() -> gravar(() -> usuarioService.atualizarUsuarioPorId(alvo.getId(), dto("senha-nova"))));
            Future<String> b = pool.submit(() -> gravar(() -> switch (concorrente) {
                case "senha" -> usuarioService.atualizarUsuarioPorId(alvo.getId(), dto("senha-outra"));
                case "status" -> usuarioService.alterarStatusUsuario(alvo.getId(), new UsuarioStatusRequestDTO("BLOQUEADO"));
                case "nivel" -> usuarioService.alterarNivelUsuario(alvo.getId(), new UsuarioNivelRequestDTO(2));
                default -> usuarioService.atualizarUsuarioPorId(alvo.getId(), dto(null));
            }));
            aguardar(leituras); assertEquals(2, contextos.size(), "Disputa exige contextos de persistencia distintos.");
            liberar.countDown();
            resultados = List.of(a.get(20, TimeUnit.SECONDS), b.get(20, TimeUnit.SECONDS));
            assertAll("Disputa deve confirmar exatamente uma gravacao: " + resultados,
                    () -> assertEquals(1, Collections.frequency(resultados, "OK"),
                            "Esperado exatamente um sucesso; resultados=" + resultados),
                    () -> assertEquals(1, Collections.frequency(resultados, "CONFLITO"),
                            "Esperado exatamente um conflito; resultados=" + resultados));
        } finally { liberar.countDown(); encerrar(pool); reset(usuarios); }
        Estado e = estado(); assertEquals(alvo.getVersaoRegistro() + 1, e.registro());
        boolean primeiraVenceu = "OK".equals(resultados.get(0));
        assertEquals(primeiraVenceu || concorrente.equals("senha") ? 1L : 0L, e.credencial());
        String senhaEsperada = primeiraVenceu ? "senha-nova"
                : concorrente.equals("senha") ? "senha-outra" : "senha-antiga";
        assertTrue(encoder.matches(senhaEsperada, e.hash()),
                "Senha e versao devem corresponder a uma unica gravacao confirmada.");
        assertFalse(e.usado());
    }
    @Test void recuperacaoImpedeSobrescritaPorEdicaoAdministrativaAntiga() throws Exception {
        CountDownLatch leu = new CountDownLatch(1), liberar = new CountDownLatch(1);
        doAnswer(i -> {
            Object resultado = mockingDetails(usuarios).getMockCreationSettings().getDefaultAnswer().answer(i);
            leu.countDown(); aguardar(liberar); return resultado;
        }).when(usuarios).findById(alvo.getId());
        ExecutorService pool = Executors.newSingleThreadExecutor(); workersEncerrados = false;
        try {
            Future<String> antiga = pool.submit(() -> gravar(() -> usuarioService.atualizarUsuarioPorId(alvo.getId(), dto("senha-outra"))));
            aguardar(leu); redefinir(); liberar.countDown();
            assertEquals("CONFLITO", antiga.get(20, TimeUnit.SECONDS));
        } finally { liberar.countDown(); encerrar(pool); reset(usuarios); }
        Estado e = estado(); assertEquals(1L, e.credencial()); assertTrue(e.usado());
        assertTrue(encoder.matches("senha-nova", e.hash()));
    }
    @Test void loginConcorrenteEmiteVersaoDaSenhaQueVerificou() throws Exception {
        CountDownLatch verificou = new CountDownLatch(1), liberar = new CountDownLatch(1);
        doAnswer(i -> {
            Object valido = mockingDetails(encoder).getMockCreationSettings().getDefaultAnswer().answer(i);
            if ("senha-antiga".equals(i.getArgument(0))) { verificou.countDown(); aguardar(liberar); }
            return valido;
        }).when(encoder).matches(any(), any());
        ExecutorService pool = Executors.newSingleThreadExecutor(); workersEncerrados = false;
        try {
            Future<String> login = pool.submit(() -> auth.login(new LoginRequestDTO(alvo.getMatricula(), "senha-antiga")).token());
            aguardar(verificou); redefinir(); liberar.countDown();
            var identidade = jwt.validarIdentidade(login.get(20, TimeUnit.SECONDS)).orElseThrow();
            assertEquals(0L, identidade.credencialVersao()); assertEquals(1L, estado().credencial());
        } finally { liberar.countDown(); encerrar(pool); reset(encoder); }
    }
    private String gravar(Supplier<?> comando) {
        autenticarMaster();
        try { comando.get(); return "OK"; }
        catch (OptimisticLockingFailureException | OptimisticLockException conflito) { return "CONFLITO"; }
        finally { SecurityContextHolder.clearContext(); }
    }
    private void aguardar(CountDownLatch latch) throws InterruptedException {
        assertTrue(latch.await(10, TimeUnit.SECONDS), "Tempo limite de sincronizacao excedido.");
    }
    private void encerrar(ExecutorService pool) throws InterruptedException {
        pool.shutdownNow(); workersEncerrados = pool.awaitTermination(5, TimeUnit.SECONDS);
        assertTrue(workersEncerrados, "Workers devem encerrar antes de limpar dados.");
    }
    @AfterEach void limpar() {
        assertTrue(workersEncerrados); reset(usuarios, recuperacoes, encoder, unidades);
        clearInvocations(unidadeController); SecurityContextHolder.clearContext();
        tx().executeWithoutResult(status -> {
            for (Long id : idsCodigos) { var r = em.find(RecuperacaoSenha.class, id); if (r != null) em.remove(r); }
            em.flush();
            for (Long id : idsUsuarios) {
                Usuario u = em.find(Usuario.class, id);
                if (u != null) { assertTrue(u.getMatricula().endsWith(marca)); em.remove(u); }
            }
            em.flush(); em.clear();
        });
        tx().executeWithoutResult(status -> {
            for (Long id : idsCodigos) assertNull(em.find(RecuperacaoSenha.class, id));
            for (Long id : idsUsuarios) assertNull(em.find(Usuario.class, id));
        });
    }
}
