package br.com.rpmont.conferencia.security;

import br.com.rpmont.conferencia.config.SecurityConfig;
import br.com.rpmont.conferencia.controller.UnidadeController;
import br.com.rpmont.conferencia.controller.UsuarioController;
import br.com.rpmont.conferencia.model.Usuario;
import br.com.rpmont.conferencia.repository.UsuarioRepository;
import br.com.rpmont.conferencia.service.UnidadeService;
import br.com.rpmont.conferencia.service.UsuarioService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.parallel.Execution;
import org.junit.jupiter.api.parallel.ExecutionMode;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.io.support.ResourcePropertySource;
import org.springframework.data.jpa.repository.support.JpaRepositoryFactoryBean;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.mock.web.MockServletContext;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.SharedEntityManagerCreator;
import org.springframework.orm.jpa.persistenceunit.PersistenceManagedTypes;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.FilterChainProxy;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.support.AnnotationConfigWebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import javax.sql.DataSource;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Consumer;
import java.util.stream.Stream;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Only synthetic users are accessed. No Boot auto-configuration or component scanning. */
@Execution(ExecutionMode.SAME_THREAD)
class JwtBloqueioMySqlIntegracaoTest {
    private static final String URL = "jdbc:mysql://127.0.0.1:3307/rpmont_homologacao";
    private static final String CONFIG = "classpath:/application-homolog.properties";
    private AnnotationConfigWebApplicationContext context;
    private EntityManager em;
    private TransactionTemplate tx;
    private MockMvc mvc;
    private JwtService jwt;
    private UsuarioService usuarios;
    private UnidadeService unidades;
    private UsuarioController usuarioController;
    private UnidadeController unidadeController;
    private final List<Long> ids = new ArrayList<>();
    private final String matricula = "jwt03-" + UUID.randomUUID().toString().replace("-", "").substring(0, 20);

    static class DestinoLocal implements ApplicationContextInitializer<ConfigurableApplicationContext> {
        @Override public void initialize(ConfigurableApplicationContext context) {
            var env = context.getEnvironment();
            if (!URL.equals(env.getProperty("spring.datasource.url"))
                    || !"rpmont_teste".equals(env.getProperty("spring.datasource.username"))
                    || !CONFIG.equals(env.getProperty("spring.config.location"))
                    || !Arrays.equals(new String[]{"homolog"}, env.getActiveProfiles())
                    || !"validate".equals(env.getProperty("spring.jpa.hibernate.ddl-auto"))
                    || env.containsProperty("spring.config.import")
                    || env.containsProperty("spring.config.additional-location")
                    || env.containsProperty("spring.profiles.include")
                    || env.containsProperty("spring.profiles.active")
                    || env.getProperty("spring.datasource.password", "").isBlank()
                    || env.getProperty("jwt.secret", "").length() < 32) {
                throw new IllegalStateException("Destino ou configuracao de homologacao nao autorizado.");
            }
        }
    }

    @Configuration(proxyBeanMethods = false)
    @EnableWebMvc
    @EnableWebSecurity
    @Import({SecurityConfig.class, JwtAuthenticationFilter.class, JwtService.class})
    static class Configuracao {
        @Bean DataSource dataSource(org.springframework.core.env.Environment env) throws Exception {
            var ds = new DriverManagerDataSource(URL, "rpmont_teste", env.getRequiredProperty("spring.datasource.password"));
            ds.setDriverClassName("com.mysql.cj.jdbc.Driver");
            // Runs before the EntityManagerFactory is instantiated; metadata only.
            try (var connection = ds.getConnection()) {
                if (!URL.equals(connection.getMetaData().getURL())
                        || !"rpmont_homologacao".equals(connection.getCatalog())) {
                    throw new IllegalStateException("Conexao fora da homologacao autorizada.");
                }
            }
            return ds;
        }
        @Bean LocalContainerEntityManagerFactoryBean entityManagerFactory(DataSource ds) {
            var factory = new LocalContainerEntityManagerFactoryBean();
            factory.setDataSource(ds);
            factory.setManagedTypes(PersistenceManagedTypes.of(Usuario.class.getName()));
            factory.setJpaVendorAdapter(new HibernateJpaVendorAdapter());
            factory.setJpaPropertyMap(Map.of("hibernate.hbm2ddl.auto", "validate",
                    "hibernate.show_sql", "false", "hibernate.cache.use_second_level_cache", "false"));
            return factory;
        }
        @Bean EntityManager entityManager(EntityManagerFactory factory) {
            return SharedEntityManagerCreator.createSharedEntityManager(factory);
        }
        @Bean PlatformTransactionManager transactionManager(EntityManagerFactory factory) {
            return new JpaTransactionManager(factory);
        }
        @Bean JpaRepositoryFactoryBean<UsuarioRepository, Usuario, Long> usuarioRepository(@org.springframework.beans.factory.annotation.Qualifier("entityManager") EntityManager em) {
            var factory = new JpaRepositoryFactoryBean<UsuarioRepository, Usuario, Long>(UsuarioRepository.class);
            factory.setEntityManager(em);
            factory.setTransactionManager("transactionManager");
            return factory;
        }
        @Bean UsuarioService usuarios() { return mock(UsuarioService.class); }
        @Bean UnidadeService unidades() { return mock(UnidadeService.class); }
        @Bean UsuarioController usuarioController(UsuarioService service) { return spy(new UsuarioController(service)); }
        @Bean UnidadeController unidadeController(UnidadeService service) { return spy(new UnidadeController(service)); }
    }

    @BeforeEach void preparar() throws Exception {
        SecurityContextHolder.clearContext();
        context = new AnnotationConfigWebApplicationContext();
        context.setServletContext(new MockServletContext());
        context.getEnvironment().setActiveProfiles("homolog");
        context.getEnvironment().getPropertySources().addLast(new ResourcePropertySource(CONFIG));
        context.getEnvironment().getPropertySources().addFirst(new MapPropertySource("config-explicita",
                Map.of("spring.config.location", CONFIG)));
        new DestinoLocal().initialize(context);
        context.register(Configuracao.class);
        context.refresh();
        em = context.getBean("entityManager", EntityManager.class);
        tx = new TransactionTemplate(context.getBean(PlatformTransactionManager.class));
        jwt = context.getBean(JwtService.class);
        usuarios = context.getBean(UsuarioService.class);
        unidades = context.getBean(UnidadeService.class);
        usuarioController = context.getBean(UsuarioController.class);
        unidadeController = context.getBean(UnidadeController.class);
        mvc = MockMvcBuilders.webAppContextSetup(context).addFilters(context.getBean(FilterChainProxy.class)).build();
        when(usuarios.listarTodosUsuario()).thenReturn(List.of());
        when(unidades.listarTodas(any())).thenReturn(List.of());
        limparInvocacoes();
        assertEquals(1, context.getBean(EntityManagerFactory.class).getMetamodel().getEntities().size());
        assertEquals(1, context.getBeansOfType(org.springframework.data.repository.Repository.class).size());
        assertTrue(context.getBeansOfType(org.springframework.mail.javamail.JavaMailSender.class).isEmpty());
    }

    private void limparInvocacoes() {
        clearInvocations(usuarios, unidades, usuarioController, unidadeController);
    }
    private Usuario criar(int nivel) {
        return tx.execute(status -> {
            Usuario u = new Usuario();
            u.setMatricula(matricula); u.setEmail(matricula + "@example.invalid");
            u.setNome("Sintetico"); u.setNomeCompleto("Usuario sintetico Achado 03");
            u.setSenha("hash-sintetico-nao-utilizado"); u.setNivel(nivel);
            u.setAtivo(true); u.setStatusAcesso("LIBERADO");
            u.setDataCadastro(LocalDate.now()); u.setDataModificacao(LocalDateTime.now());
            em.persist(u); ids.add(u.getId()); em.flush();
            assertEquals(0L, u.getCredencialVersao());
            assertNotNull(u.getVersaoRegistro());
            return u;
        });
    }
    private void alterar(Long id, Consumer<Usuario> mudanca) {
        tx.executeWithoutResult(status -> {
            Usuario atual = em.find(Usuario.class, id);
            assertNotNull(atual); assertEquals(matricula, atual.getMatricula());
            mudanca.accept(atual); em.flush();
        });
    }
    private void conferir(Long id, Boolean ativo, String acesso) {
        tx.executeWithoutResult(status -> {
            Usuario atual = em.find(Usuario.class, id);
            assertNotNull(atual); assertEquals(ativo, atual.getAtivo());
            assertEquals(acesso, atual.getStatusAcesso());
        });
    }
    private void autorizado(String rota, String token) throws Exception {
        assertFalse(TransactionSynchronizationManager.isActualTransactionActive());
        limparInvocacoes();
        mvc.perform(get(rota).header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andExpect(content().json("[]"));
        if (rota.equals("/usuario")) {
            verify(usuarioController).listarTodosUsuario(); verify(usuarios).listarTodosUsuario();
        } else {
            verify(unidadeController).listarTodas(any()); verify(unidades).listarTodas(any());
        }
    }
    private void negado(String rota, String token) throws Exception {
        assertFalse(TransactionSynchronizationManager.isActualTransactionActive());
        limparInvocacoes();
        var resultado = mvc.perform(get(rota).header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden()).andReturn();
        assertNull(resultado.getHandler());
        verifyNoInteractions(usuarios, unidades, usuarioController, unidadeController);
        String resposta = resultado.getResponse().getContentAsString(StandardCharsets.UTF_8)
                + String.valueOf(resultado.getResponse().getErrorMessage())
                + resultado.getResponse().getHeaderNames().stream()
                .map(nome -> resultado.getResponse().getHeaders(nome).toString()).reduce("", String::concat);
        for (String proibido : List.of(token, matricula, "hash-sintetico-nao-utilizado", "jdbc:mysql:",
                "java.lang.", "org.hibernate", "stackTrace",
                context.getEnvironment().getRequiredProperty("spring.datasource.password"),
                context.getEnvironment().getRequiredProperty("jwt.secret"))) {
            assertFalse(resposta.contains(proibido), "Resposta contem informacao protegida.");
        }
    }
    static Stream<Arguments> casos() {
        return Stream.of("/usuario", "/unidades").flatMap(rota -> Stream.of(1, 2)
                .map(nivel -> Arguments.of(rota, nivel)));
    }
    @ParameterizedTest @MethodSource("casos")
    void mesmoJwtBloqueioEDesbloqueio(String rota, int nivel) throws Exception {
        Usuario usuario = criar(nivel); String token = jwt.gerarToken(usuario);
        autorizado(rota, token);
        alterar(usuario.getId(), u -> u.setStatusAcesso("BLOQUEADO"));
        conferir(usuario.getId(), true, "BLOQUEADO"); negado(rota, token);
        alterar(usuario.getId(), u -> u.setStatusAcesso("LIBERADO"));
        conferir(usuario.getId(), true, "LIBERADO"); autorizado(rota, token);
    }
    @ParameterizedTest @MethodSource("casos")
    void mesmoJwtInativacaoEReativacao(String rota, int nivel) throws Exception {
        Usuario usuario = criar(nivel); String token = jwt.gerarToken(usuario);
        autorizado(rota, token);
        alterar(usuario.getId(), u -> u.setAtivo(false));
        conferir(usuario.getId(), false, "LIBERADO"); negado(rota, token);
        alterar(usuario.getId(), u -> u.setAtivo(true));
        conferir(usuario.getId(), true, "LIBERADO"); autorizado(rota, token);
    }
    @ParameterizedTest @MethodSource("casos")
    void mesmoJwtUsuarioRemovido(String rota, int nivel) throws Exception {
        Usuario usuario = criar(nivel); String token = jwt.gerarToken(usuario);
        autorizado(rota, token);
        alterar(usuario.getId(), em::remove);
        tx.executeWithoutResult(status -> assertNull(em.find(Usuario.class, usuario.getId())));
        negado(rota, token);
    }

    @AfterEach void limpar() {
        try {
            // assertAll attempts cleanup of every captured ID even if one cleanup fails.
            assertAll("Limpeza dos IDs sinteticos", ids.stream().map(id ->
                    (org.junit.jupiter.api.function.Executable) () -> {
                        tx.executeWithoutResult(status -> {
                            Usuario usuario = em.find(Usuario.class, id);
                            if (usuario != null) {
                                assertEquals(matricula, usuario.getMatricula(), "ID nao pertence a fixture.");
                                em.remove(usuario); em.flush();
                            }
                        });
                        tx.executeWithoutResult(status ->
                                assertNull(em.find(Usuario.class, id), "Usuario sintetico residual."));
                    }));
            if (!ids.isEmpty()) System.out.println("ACHADO03_MYSQL_LIMPEZA_OK: " + ids.size() + " ID sintetico verificado.");
        } finally {
            if (context != null) context.close();
            SecurityContextHolder.clearContext();
        }
    }
}
