package br.com.rpmont.conferencia;

import br.com.rpmont.conferencia.dtos.RegistrarSaidaFenoRacaoRequestDTO;
import br.com.rpmont.conferencia.enums.SituacaoLoteFenoRacao;
import br.com.rpmont.conferencia.enums.SituacaoMovimentacaoFenoRacao;
import br.com.rpmont.conferencia.enums.SituacaoProdutoFenoRacao;
import br.com.rpmont.conferencia.enums.TipoMovimentacaoFenoRacao;
import br.com.rpmont.conferencia.enums.TipoProdutoFenoRacao;
import br.com.rpmont.conferencia.enums.UnidadeControleFenoRacao;
import br.com.rpmont.conferencia.model.LoteFenoRacao;
import br.com.rpmont.conferencia.model.MovimentacaoFenoRacao;
import br.com.rpmont.conferencia.model.ProdutoFenoRacao;
import br.com.rpmont.conferencia.model.Usuario;
import br.com.rpmont.conferencia.repository.LoteFenoRacaoRepository;
import br.com.rpmont.conferencia.repository.MovimentacaoFenoRacaoRepository;
import br.com.rpmont.conferencia.repository.NotificacaoFenoRacaoRepository;
import br.com.rpmont.conferencia.repository.UsuarioRepository;
import br.com.rpmont.conferencia.service.MovimentacaoFenoRacaoServiceImpl;
import br.com.rpmont.conferencia.service.NotificacaoFenoRacaoService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.LockModeType;
import jakarta.persistence.PersistenceContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.aop.framework.Advised;
import org.springframework.aop.support.AopUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.FilterType;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.EnumerablePropertySource;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.jdbc.datasource.AbstractDataSource;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.persistenceunit.PersistenceManagedTypes;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.EnableTransactionManagement;
import org.springframework.transaction.interceptor.TransactionInterceptor;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionTemplate;

import javax.sql.DataSource;
import java.math.BigDecimal;
import java.math.BigInteger;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.SQLFeatureNotSupportedException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Properties;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;

/**
 * Teste com escrita, desabilitado por padrao. Habilitacao: propriedade de sistema
 * rpmont.saida.mysql.habilitado=true. Credenciais exclusivas de homologacao devem
 * ser fornecidas em RPMONT_SAIDA_MYSQL_USUARIO e RPMONT_SAIDA_MYSQL_SENHA.
 * Nao carrega application*.properties, perfis Boot ou configuracoes do Aiven.
 * Uma colisao UNIQUE aborta a preparacao: nunca reutilizar produtos existentes.
 */
@EnabledIfSystemProperty(named = "rpmont.saida.mysql.habilitado", matches = "true")
@ExtendWith(SpringExtension.class)
@ContextConfiguration(
        classes = FenoRacaoSaidaMySqlIntegracaoTest.Configuracao.class,
        initializers = FenoRacaoSaidaMySqlIntegracaoTest.DestinoLocal.class
)
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:mysql://127.0.0.1:3307/rpmont_homologacao",
        "spring.jpa.hibernate.ddl-auto=validate",
        "spring.jpa.generate-ddl=false",
        "spring.sql.init.mode=never"
})
class FenoRacaoSaidaMySqlIntegracaoTest {
    private static final String URL = "jdbc:mysql://127.0.0.1:3307/rpmont_homologacao";
    private static final String CATALOGO = "rpmont_homologacao";
    private static final String HABILITACAO = "rpmont.saida.mysql.habilitado";
    private static final Map<String, String> PROPRIEDADES_PERMITIDAS = Map.of(
            "springdatasourceurl", URL,
            "springjpahibernateddlauto", "validate",
            "springjpagenerateddl", "false",
            "springsqlinitmode", "never"
    );
    private final String marca = UUID.randomUUID().toString().replace("-", "");
    private final String matricula = "SAIDA-IT-" + marca;
    private final String email = "t" + marca + "@example.invalid";
    private final String nomeProduto = "Feno de teste " + marca;
    private final String documento = "DOC-" + marca;
    // DECIMAL(10,2), longe dos pesos operacionais usuais; nao garante ausencia
    // de colisao. A UNIQUE fisica e obrigatoria e uma colisao causa rollback.
    private final BigDecimal pesoUnidade = new BigDecimal(
            new BigInteger(marca, 16).mod(BigInteger.valueOf(900_000_000L))
                    .add(BigInteger.valueOf(100_000_000L)), 2);
    private boolean preparacaoIniciada;
    private boolean limpezaEmAndamento;
    private Long usuarioId;
    private Integer produtoId;
    private Integer loteId;
    private Long movimentacaoId;
    private List<String> registrosLocalizados = List.of();

    private static void exigirHabilitacao() {
        if (!"true".equals(System.getProperty(HABILITACAO))) {
            throw new IllegalStateException("Teste MySQL desabilitado; exige " + HABILITACAO + "=true.");
        }
    }

    private static void validarConfiguracao(ConfigurableEnvironment env) {
        exigirHabilitacao();
        // Hibernate tambem pode carregar este recurso sem passar pelo Spring.
        // Verifica apenas a existencia; nao abre nem exibe seu conteudo.
        if (Configuracao.class.getClassLoader().getResource("hibernate.properties") != null) {
            throw new IllegalStateException("hibernate.properties externo presente; inicializacao impedida.");
        }
        if (env.getActiveProfiles().length != 0) {
            throw new IllegalStateException("Perfis externos nao sao permitidos neste teste.");
        }
        for (String alternativa : List.of("spring.datasource.hikari.jdbc-url",
                "spring.datasource.jndi-name", "spring.datasource.type",
                "spring.datasource.driver-class-name", "spring.config.import",
                "spring.config.location", "spring.config.additional-location")) {
            if (env.containsProperty(alternativa)) {
                throw new IllegalStateException("Redirecionamento/configuracao externa nao permitido; valores omitidos.");
            }
        }
        // Inspeciona nomes e valores seguros de configuracao, nunca credenciais.
        // A normalizacao tambem cobre SPRING_DATASOURCE_HIKARI_JDBC_URL.
        for (var fonte : env.getPropertySources()) {
            if (!(fonte instanceof EnumerablePropertySource<?> enumeravel)) continue;
            for (String nome : enumeravel.getPropertyNames()) {
                String chave = nome.replaceAll("[^a-zA-Z0-9]", "").toLowerCase(Locale.ROOT);
                boolean restrita = chave.startsWith("springdatasource")
                        || chave.startsWith("springjpa") || chave.startsWith("springsql")
                        || chave.startsWith("springconfig") || chave.startsWith("springprofiles")
                        || chave.startsWith("springflyway") || chave.startsWith("springliquibase")
                        || chave.startsWith("springjta") || chave.startsWith("hibernate")
                        || chave.startsWith("jakartapersistence") || chave.startsWith("javaxpersistence");
                if (restrita) {
                    String esperado = PROPRIEDADES_PERMITIDAS.get(chave);
                    if (esperado == null || !esperado.equals(Objects.toString(fonte.getProperty(nome), ""))) {
                        throw new IllegalStateException("Configuracao externa de banco/JPA nao permitida; valores omitidos.");
                    }
                }
            }
        }
        if (!URL.equals(env.getProperty("spring.datasource.url"))
                || !"validate".equals(env.getProperty("spring.jpa.hibernate.ddl-auto"))
                || !"false".equals(env.getProperty("spring.jpa.generate-ddl"))
                || !"never".equals(env.getProperty("spring.sql.init.mode"))) {
            throw new IllegalStateException("Configuracao fixa de homologacao divergente.");
        }
    }

    static class DestinoLocal implements ApplicationContextInitializer<ConfigurableApplicationContext> {
        @Override
        public void initialize(ConfigurableApplicationContext context) {
            validarConfiguracao(context.getEnvironment());
        }
    }

    // Contexto Spring explicito: sem SpringBootTest, ConfigData, component scan
    // geral ou EnableAutoConfiguration. Nao existem inicializadores SQL/DDL Boot.
    @Configuration(proxyBeanMethods = false)
    @EnableTransactionManagement(proxyTargetClass = true)
    @EnableJpaRepositories(
            basePackages = "br.com.rpmont.conferencia.repository",
            includeFilters = @ComponentScan.Filter(
                    type = FilterType.ASSIGNABLE_TYPE,
                    classes = {UsuarioRepository.class, LoteFenoRacaoRepository.class,
                            MovimentacaoFenoRacaoRepository.class}
            )
    )
    static class Configuracao {
        @Bean
        DataSource dataSource(ConfigurableEnvironment env) throws ClassNotFoundException {
            validarConfiguracao(env);
            Class.forName("com.mysql.cj.jdbc.Driver");
            // Leitura apenas em execucao explicitamente habilitada. Sem arquivos,
            // fallback para credenciais de producao ou vinculacao ConfigurationProperties.
            String usuario = System.getenv("RPMONT_SAIDA_MYSQL_USUARIO");
            String senha = System.getenv("RPMONT_SAIDA_MYSQL_SENHA");
            if (usuario == null || usuario.isBlank() || senha == null || senha.isBlank()) {
                throw new IllegalStateException("Credenciais exclusivas do teste MySQL nao fornecidas.");
            }
            return new AbstractDataSource() {
                @Override
                public Connection getConnection() throws SQLException {
                    validarConfiguracao(env); // Tambem antes de cada conexao do Hibernate.
                    Properties propriedades = new Properties();
                    propriedades.setProperty("user", usuario);
                    propriedades.setProperty("password", senha);
                    propriedades.setProperty("connectTimeout", "5000");
                    propriedades.setProperty("socketTimeout", "10000");
                    return DriverManager.getConnection(URL, propriedades);
                }

                @Override
                public Connection getConnection(String usuarioAlternativo, String senhaAlternativa)
                        throws SQLException {
                    throw new SQLFeatureNotSupportedException("Credenciais alternativas nao permitidas.");
                }
            };
        }

        @Bean
        PersistenceManagedTypes tipos() {
            return PersistenceManagedTypes.of(Usuario.class.getName(), ProdutoFenoRacao.class.getName(),
                    LoteFenoRacao.class.getName(), MovimentacaoFenoRacao.class.getName());
        }

        @Bean
        LocalContainerEntityManagerFactoryBean entityManagerFactory(DataSource dataSource,
                                                                     PersistenceManagedTypes tipos) {
            var adapter = new HibernateJpaVendorAdapter();
            adapter.setGenerateDdl(false);
            var factory = new LocalContainerEntityManagerFactoryBean();
            factory.setPersistenceUnitName("saida-mysql-it");
            String descritorAusente = "META-INF/rpmont-saida-it-sem-descritor.xml";
            if (Configuracao.class.getClassLoader().getResource(descritorAusente) != null) {
                throw new IllegalStateException("Descritor JPA externo inesperado; inicializacao impedida.");
            }
            factory.setPersistenceXmlLocation("classpath*:" + descritorAusente);
            factory.setMappingResources(new String[0]);
            factory.setDataSource(dataSource);
            factory.setManagedTypes(tipos);
            factory.setJpaVendorAdapter(adapter);
            // Mapa fechado: nao vincular propriedades JPA externas. Nao definir
            // database.action=none, pois isso pode suprimir hbm2ddl.auto=validate.
            factory.setJpaPropertyMap(Map.of(
                    "hibernate.hbm2ddl.auto", "validate",
                    "jakarta.persistence.schema-generation.scripts.action", "none",
                    "hibernate.cache.use_second_level_cache", false,
                    "hibernate.cache.use_query_cache", false
            ));
            return factory;
        }

        @Bean
        PlatformTransactionManager transactionManager(EntityManagerFactory factory) {
            return new JpaTransactionManager(factory);
        }

        @Bean
        NotificacaoFenoRacaoRepository notificacoesSimuladas() {
            return mock(NotificacaoFenoRacaoRepository.class);
        }

        @Bean
        NotificacaoFenoRacaoService notificacaoServiceSimulado() {
            return mock(NotificacaoFenoRacaoService.class);
        }

        @Bean
        MovimentacaoFenoRacaoServiceImpl servicoReal(
                MovimentacaoFenoRacaoRepository movimentos, LoteFenoRacaoRepository lotes,
                UsuarioRepository usuarios, NotificacaoFenoRacaoRepository notificacoes,
                EntityManager entityManager, NotificacaoFenoRacaoService notificacaoService) {
            return new MovimentacaoFenoRacaoServiceImpl(
                    movimentos, lotes, usuarios, notificacoes, entityManager, notificacaoService);
        }
    }

    @Autowired private DataSource dataSource;
    @Autowired private PlatformTransactionManager transactionManager;
    @Autowired private MovimentacaoFenoRacaoServiceImpl service;
    @PersistenceContext private EntityManager em;

    private TransactionTemplate transacao() {
        var template = new TransactionTemplate(transactionManager);
        template.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        return template;
    }

    private void verificarDestinoEUnicidade() throws SQLException {
        exigirHabilitacao();
        try (var conexao = dataSource.getConnection()) {
            var metadata = conexao.getMetaData();
            assertEquals(URL, metadata.getURL(), "JDBC inesperado");
            assertEquals(CATALOGO, conexao.getCatalog(), "Catalogo inesperado");
            assertEquals("MySQL", metadata.getDatabaseProductName(), "Banco inesperado");
            // Rollback de falha parcial exige tabelas transacionais. A consulta
            // sera feita somente na futura execucao habilitada, antes de gravar.
            Set<String> tabelas = Set.of("usuarios_sistema", "TB_produto_feno_racao",
                    "TB_lote_feno_racao", "TB_movimentacao_feno_racao");
            Set<String> transacionais = new HashSet<>();
            try (var consulta = conexao.prepareStatement(
                    "select TABLE_NAME, ENGINE from information_schema.TABLES where TABLE_SCHEMA = ?")) {
                consulta.setString(1, CATALOGO);
                try (var resultado = consulta.executeQuery()) {
                    while (resultado.next()) {
                        String tabela = resultado.getString("TABLE_NAME");
                        if (tabelas.contains(tabela) && "InnoDB".equalsIgnoreCase(resultado.getString("ENGINE"))) {
                            transacionais.add(tabela);
                        }
                    }
                }
            }
            assertEquals(tabelas, transacionais,
                    "Isolamento nao garantido: todas as tabelas do teste devem usar InnoDB; preparacao impedida");
            // Impede que a limpeza dispare exclusoes/alteracoes em outras linhas
            // por acoes referenciais automaticas, mesmo fora das quatro entidades.
            for (String tabela : tabelas) {
                try (var referencias = metadata.getExportedKeys(CATALOGO, null, tabela)) {
                    while (referencias.next()) {
                        int regra = referencias.getShort("DELETE_RULE");
                        assertTrue(regra == java.sql.DatabaseMetaData.importedKeyRestrict
                                        || regra == java.sql.DatabaseMetaData.importedKeyNoAction,
                                "Acao referencial de DELETE nao segura em " + tabela + "; preparacao impedida");
                    }
                }
            }
            Map<String, Set<String>> indices = new HashMap<>();
            try (var resultado = metadata.getIndexInfo(CATALOGO, null, "TB_produto_feno_racao", true, false)) {
                while (resultado.next()) {
                    String indice = resultado.getString("INDEX_NAME");
                    String coluna = resultado.getString("COLUMN_NAME");
                    if (indice != null && coluna != null && !resultado.getBoolean("NON_UNIQUE")) {
                        indices.computeIfAbsent(indice, ignorado -> new HashSet<>())
                                .add(coluna.toLowerCase(Locale.ROOT));
                    }
                }
            }
            assertTrue(indices.values().stream().anyMatch(
                            colunas -> colunas.equals(Set.of("tipoproduto", "pesounidadekg"))),
                    "Sem UNIQUE fisica de tipo/peso: isolamento nao garantido; nenhuma preparacao autorizada.");
        }
    }

    private void verificarProxyTransacional() throws NoSuchMethodException {
        assertFalse(TransactionSynchronizationManager.isActualTransactionActive(), "Transacao externa inesperada");
        assertTrue(AopUtils.isAopProxy(service), "Servico deve passar pelo proxy Spring");
        assertInstanceOf(Advised.class, service);
        var metodo = MovimentacaoFenoRacaoServiceImpl.class.getMethod(
                "registrarSaida", RegistrarSaidaFenoRacaoRequestDTO.class, String.class);
        assertTrue(Arrays.stream(((Advised) service).getAdvisors()).anyMatch(advisor ->
                        advisor.getAdvice() instanceof TransactionInterceptor interceptor
                                && interceptor.getTransactionAttributeSource() != null
                                && interceptor.getTransactionAttributeSource()
                                .getTransactionAttribute(metodo, AopUtils.getTargetClass(service)) != null),
                "registrarSaida deve possuir interceptor transacional aplicavel");
    }

    @Test
    void registrarSaidaAutorizadaPersisteSaldoEMovimentacao() throws Exception {
        verificarProxyTransacional();
        verificarDestinoEUnicidade();
        final LocalDate hoje = LocalDate.now();
        preparacaoIniciada = true;
        // Qualquer colisao/assertiva/falha de flush desfaz toda a preparacao.
        transacao().executeWithoutResult(status -> {
            assertTrue(usuariosDaExecucao().isEmpty() && produtosDaExecucao().isEmpty()
                            && lotesDaExecucao().isEmpty(),
                    "Identificador sintetico ja ocupado; preparacao impedida");
            Long existentes = em.createQuery(
                    "select count(p) from ProdutoFenoRacao p where p.tipoProduto = :tipo and p.pesoUnidadeKg = :peso",
                    Long.class).setParameter("tipo", TipoProdutoFenoRacao.FENO)
                    .setParameter("peso", pesoUnidade).getSingleResult();
            assertEquals(0L, existentes,
                    "Peso sintetico ocupado: execucao impedida, sem reutilizar produto preexistente");

            Usuario usuario = new Usuario();
            usuario.setMatricula(matricula);
            usuario.setNome("Teste Sintetico");
            usuario.setSenha("hash-ficticio-sem-login");
            usuario.setEmail(email);
            usuario.setNivel(3);
            usuario.setSetor("Baia");
            usuario.setNomeCompleto("Usuario de teste de homologacao");
            usuario.setUnidade("RPMont");
            usuario.setStatusAcesso("LIBERADO");
            usuario.setAtivo(true);
            usuario.setDataCadastro(hoje);
            usuario.setDataModificacao(LocalDateTime.now());
            em.persist(usuario);
            usuarioId = usuario.getId();
            em.flush();

            ProdutoFenoRacao produto = new ProdutoFenoRacao();
            produto.setTipoProduto(TipoProdutoFenoRacao.FENO);
            produto.setNomeProduto(nomeProduto);
            produto.setUnidadeControle(UnidadeControleFenoRacao.FARDO);
            produto.setPesoUnidadeKg(pesoUnidade);
            produto.setSituacao(SituacaoProdutoFenoRacao.ATIVO);
            produto.setUsuarioCadastroId(usuarioId);
            produto.setDataCadastro(LocalDateTime.now());
            em.persist(produto);
            produtoId = produto.getId();
            em.flush();

            LoteFenoRacao lote = new LoteFenoRacao();
            lote.setProduto(produto);
            lote.setCodigoLote(matricula);
            lote.setQuantidadeInicial(10);
            lote.setQuantidadeAtual(10);
            lote.setPesoTotalInicialKg(pesoUnidade.multiply(BigDecimal.TEN));
            lote.setPesoTotalAtualKg(pesoUnidade.multiply(BigDecimal.TEN));
            lote.setDataEntrada(hoje);
            lote.setResponsavelRecebimento("Recebimento sintetico");
            lote.setUnidade("RPMont");
            lote.setSituacao(SituacaoLoteFenoRacao.ATIVO);
            lote.setUsuarioCadastroId(usuarioId);
            lote.setDataCadastro(LocalDateTime.now());
            em.persist(lote);
            loteId = lote.getId();
            em.flush();
        });

        verificarProxyTransacional();
        BigDecimal solicitada = pesoUnidade.add(BigDecimal.ONE);
        var resposta = service.registrarSaida(new RegistrarSaidaFenoRacaoRequestDTO(
                loteId, solicitada, hoje, "Servico sintetico", "Responsavel sintetico",
                documento, "Teste de homologacao"), matricula);
        assertNotNull(resposta);
        movimentacaoId = resposta.id();
        assertNotNull(movimentacaoId);
        assertFalse(TransactionSynchronizationManager.isActualTransactionActive(), "Servico nao encerrou a transacao");

        // Outra transacao, sem caches de segundo nivel e sem entidades da preparacao.
        transacao().executeWithoutResult(status -> {
            em.clear();
            LoteFenoRacao lote = em.find(LoteFenoRacao.class, loteId);
            assertNotNull(lote);
            assertEquals(8, lote.getQuantidadeAtual());
            assertDecimal(pesoUnidade.multiply(BigDecimal.valueOf(8)), lote.getPesoTotalAtualKg());
            assertEquals(SituacaoLoteFenoRacao.ATIVO, lote.getSituacao());
            List<MovimentacaoFenoRacao> movimentos = movimentosDoLote(loteId);
            assertEquals(1, movimentos.size(), "Deve existir exatamente uma movimentacao do lote sintetico");
            MovimentacaoFenoRacao movimento = movimentos.getFirst();
            assertEquals(movimentacaoId, movimento.getId());
            assertEquals(TipoMovimentacaoFenoRacao.SAIDA, movimento.getTipoMovimentacao());
            assertEquals(SituacaoMovimentacaoFenoRacao.ATIVA, movimento.getSituacao());
            assertEquals(produtoId, movimento.getProduto().getId());
            assertEquals(usuarioId, movimento.getUsuarioId());
            assertEquals(loteId, movimento.getLote().getId());
            assertEquals(10, movimento.getSaldoAnterior());
            assertEquals(8, movimento.getSaldoPosterior());
            assertEquals(2, movimento.getQuantidadeUnidades());
            assertDecimal(pesoUnidade, movimento.getPesoUnidadeKg());
            assertDecimal(solicitada, movimento.getQuantidadeSolicitadaKg());
            assertDecimal(pesoUnidade.multiply(BigDecimal.valueOf(2)), movimento.getPesoMovimentadoKg());
            assertDecimal(pesoUnidade.subtract(BigDecimal.ONE), movimento.getSobraCalculadaKg());
            assertEquals(documento, movimento.getNumeroDocumento());
        });
    }

    private static void assertDecimal(BigDecimal esperado, BigDecimal atual) {
        assertNotNull(atual);
        assertEquals(0, esperado.compareTo(atual));
    }

    private List<MovimentacaoFenoRacao> movimentosDoLote(Integer id) {
        return em.createQuery("select m from MovimentacaoFenoRacao m where m.lote.id = :id",
                MovimentacaoFenoRacao.class).setParameter("id", id)
                .setLockMode(limpezaEmAndamento ? LockModeType.PESSIMISTIC_WRITE : LockModeType.NONE)
                .getResultList();
    }

    private List<Usuario> usuariosDaExecucao() {
        return em.createQuery("select u from Usuario u where u.matricula = :matricula or u.email = :email",
                Usuario.class).setParameter("matricula", matricula).setParameter("email", email)
                .setLockMode(limpezaEmAndamento ? LockModeType.PESSIMISTIC_WRITE : LockModeType.NONE)
                .getResultList();
    }

    private List<ProdutoFenoRacao> produtosDaExecucao() {
        return em.createQuery("select p from ProdutoFenoRacao p where p.nomeProduto = :nome",
                ProdutoFenoRacao.class).setParameter("nome", nomeProduto)
                .setLockMode(limpezaEmAndamento ? LockModeType.PESSIMISTIC_WRITE : LockModeType.NONE)
                .getResultList();
    }

    private List<LoteFenoRacao> lotesDaExecucao() {
        return em.createQuery("select l from LoteFenoRacao l where l.codigoLote = :codigo",
                LoteFenoRacao.class).setParameter("codigo", matricula)
                .setLockMode(limpezaEmAndamento ? LockModeType.PESSIMISTIC_WRITE : LockModeType.NONE)
                .getResultList();
    }

    private static void exigirPropriedade(boolean comprovada) {
        if (!comprovada) {
            throw new IllegalStateException("Propriedade sintetica nao comprovada; limpeza abortada sem exclusoes.");
        }
    }

    private List<String> identificarRegistros() {
        List<String> encontrados = new ArrayList<>();
        for (var u : usuariosDaExecucao()) encontrados.add("usuario=" + u.getId());
        for (var p : produtosDaExecucao()) encontrados.add("produto=" + p.getId());
        for (var l : lotesDaExecucao()) {
            encontrados.add("lote=" + l.getId());
            for (var m : movimentosDoLote(l.getId())) encontrados.add("movimentacao=" + m.getId());
        }
        // Inclui dependentes mesmo se o lote tiver desaparecido ou perdido a marca.
        if (loteId != null) {
            for (var m : movimentosDoLote(loteId)) encontrados.add("movimentacaoDoLoteConhecido=" + m.getId());
        }
        if (usuarioId != null && em.find(Usuario.class, usuarioId) != null) encontrados.add("usuarioConhecido=" + usuarioId);
        if (produtoId != null && em.find(ProdutoFenoRacao.class, produtoId) != null) encontrados.add("produtoConhecido=" + produtoId);
        if (loteId != null && em.find(LoteFenoRacao.class, loteId) != null) encontrados.add("loteConhecido=" + loteId);
        // O ID da resposta e somente diagnostico; nunca autoriza remocao.
        if (movimentacaoId != null && em.find(MovimentacaoFenoRacao.class, movimentacaoId) != null) {
            encontrados.add("movimentacaoDaResposta=" + movimentacaoId);
        }
        return encontrados;
    }

    @AfterEach
    void removerSomenteRegistrosCriadosPeloTeste() {
        if (!preparacaoIniciada) return;
        limpezaEmAndamento = true;
        try {
            transacao().executeWithoutResult(status -> {
                em.clear();
                registrosLocalizados = identificarRegistros();
                var usuarios = usuariosDaExecucao();
                var produtos = produtosDaExecucao();
                var lotes = lotesDaExecucao();
                exigirPropriedade(usuarios.size() <= 1 && produtos.size() <= 1 && lotes.size() <= 1);
                // Confere toda a cadeia ANTES de agendar a primeira exclusao.
                for (var u : usuarios) {
                    exigirPropriedade(Objects.equals(usuarioId, u.getId())
                            && matricula.equals(u.getMatricula()) && email.equals(u.getEmail()));
                }
                for (var p : produtos) {
                    exigirPropriedade(Objects.equals(produtoId, p.getId()) && nomeProduto.equals(p.getNomeProduto())
                            && Objects.equals(usuarioId, p.getUsuarioCadastroId())
                            && p.getTipoProduto() == TipoProdutoFenoRacao.FENO
                            && p.getPesoUnidadeKg() != null && pesoUnidade.compareTo(p.getPesoUnidadeKg()) == 0
                            && usuarios.size() == 1);
                }
                List<MovimentacaoFenoRacao> movimentos = new ArrayList<>();
                for (var l : lotes) {
                    exigirPropriedade(Objects.equals(loteId, l.getId()) && matricula.equals(l.getCodigoLote())
                            && Objects.equals(produtoId, l.getProduto().getId())
                            && Objects.equals(usuarioId, l.getUsuarioCadastroId()) && produtos.size() == 1);
                    movimentos.addAll(movimentosDoLote(l.getId()));
                }
                for (var m : movimentos) {
                    exigirPropriedade(documento.equals(m.getNumeroDocumento())
                            && Objects.equals(usuarioId, m.getUsuarioId())
                            && Objects.equals(produtoId, m.getProduto().getId())
                            && Objects.equals(loteId, m.getLote().getId())
                            && m.getTipoMovimentacao() == TipoMovimentacaoFenoRacao.SAIDA);
                }
                movimentos.forEach(em::remove);
                em.flush();
                lotes.forEach(em::remove);
                em.flush();
                produtos.forEach(em::remove);
                em.flush();
                usuarios.forEach(em::remove);
                em.flush();
            });
            limpezaEmAndamento = false;
            registrosLocalizados = transacao().execute(status -> {
                em.clear();
                return identificarRegistros();
            });
            if (registrosLocalizados == null || !registrosLocalizados.isEmpty()) {
                throw new IllegalStateException("Verificacao encontrou residuos apos a limpeza.");
            }
        } catch (RuntimeException | AssertionError falha) {
            limpezaEmAndamento = false;
            String diagnostico;
            try {
                registrosLocalizados = transacao().execute(status -> {
                    em.clear();
                    return identificarRegistros();
                });
                diagnostico = "Registros ainda presentes=" + registrosLocalizados;
            } catch (RuntimeException | AssertionError falhaDiagnostico) {
                falha.addSuppressed(falhaDiagnostico);
                diagnostico = "Nao foi possivel confirmar residuos; ultimos localizados=" + registrosLocalizados;
            }
            throw new IllegalStateException("Limpeza incompleta da execucao " + marca
                    + "; IDs conhecidos: usuario=" + usuarioId + ", produto=" + produtoId
                    + ", lote=" + loteId + ", movimentacaoResposta=" + movimentacaoId
                    + ". " + diagnostico + ". Nenhuma exclusao ampla foi autorizada.", falha);
        }
    }
}
