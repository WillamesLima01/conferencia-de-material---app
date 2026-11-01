package br.com.rpmont.conferencia.support;

import br.com.rpmont.conferencia.controller.MovimentacaoMaterialController;
import br.com.rpmont.conferencia.config.SecurityConfig;
import br.com.rpmont.conferencia.dtos.MovimentacaoMaterialFiltroDTO;
import br.com.rpmont.conferencia.exception.GlobalExceptionHandler;
import br.com.rpmont.conferencia.model.*;
import br.com.rpmont.conferencia.enums.*;
import br.com.rpmont.conferencia.repository.*;
import br.com.rpmont.conferencia.security.*;
import br.com.rpmont.conferencia.service.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.AfterEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringBootConfiguration;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.annotation.*;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.orm.jpa.persistenceunit.PersistenceManagedTypes;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import javax.sql.DataSource;
import java.time.*;
import java.util.*;
import java.util.function.Consumer;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;

/** Only synthetic rows whose generated IDs were captured are read or removed. */
public abstract class PatrimonioHomologacaoFixture {
    public static final String URL = "jdbc:mysql://127.0.0.1:3307/rpmont_homologacao";

    public static class DestinoLocal implements ApplicationContextInitializer<ConfigurableApplicationContext> {
        @Override public void initialize(ConfigurableApplicationContext context) {
            var env = context.getEnvironment();
            if (!URL.equals(env.getProperty("spring.datasource.url"))
                    || !"classpath:/application-homolog.properties".equals(env.getProperty("spring.config.location"))
                    || !Arrays.equals(new String[]{"homolog"}, env.getActiveProfiles())
                    || !"validate".equals(env.getProperty("spring.jpa.hibernate.ddl-auto"))
                    || env.containsProperty("spring.config.import")
                    || env.containsProperty("spring.config.additional-location")) {
                throw new IllegalStateException("Destino ou configuracao de homologacao nao autorizado.");
            }
        }
    }

    @SpringBootConfiguration
    @EnableAutoConfiguration
    @EnableJpaRepositories(basePackages = "br.com.rpmont.conferencia.repository",
            includeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE,
                    classes = {UsuarioRepository.class, MaterialPatrimonialRepository.class,
                            MovimentacaoMaterialRepository.class}))
    @Import({MovimentacaoMaterialServiceImpl.class, MovimentacaoMaterialController.class,
            SecurityConfig.class, JwtAuthenticationFilter.class, JwtService.class, GlobalExceptionHandler.class})
    public static class Configuracao {
        @Bean PersistenceManagedTypes tipos() {
            return PersistenceManagedTypes.of(Usuario.class.getName(), MaterialPatrimonial.class.getName(),
                    MovimentacaoMaterial.class.getName());
        }
        @Bean EmailService emailService() { return mock(EmailService.class); }
    }

    @Autowired protected MovimentacaoMaterialService service;
    @Autowired protected JwtService jwt;
    @Autowired private DataSource dataSource;
    @Autowired private PlatformTransactionManager transactionManager;
    @PersistenceContext protected EntityManager em;
    protected final String marca = UUID.randomUUID().toString().replace("-", "").substring(0, 20);
    protected String unidadeA = "TESTE-A-" + marca;
    protected String unidadeB = "TESTE-B-" + marca;
    protected Usuario autor;
    protected MaterialPatrimonial materialA, materialB;
    protected final List<Long> usuarios = new ArrayList<>();
    protected final List<Long> materiais = new ArrayList<>();
    protected final List<Long> movimentos = new ArrayList<>();
    protected Long movimentoA1, movimentoA2, movimentoB;
    private int sequencia;
    protected TransactionTemplate tx() { return new TransactionTemplate(transactionManager); }

    @BeforeEach
    void preparar() throws Exception {
        try (var connection = dataSource.getConnection()) {
            assertTrue(URL.equals(connection.getMetaData().getURL()), "URL JDBC nao autorizada.");
            assertTrue("rpmont_homologacao".equals(connection.getCatalog()), "Catalogo nao autorizado.");
        }
        autor = usuario(1, null, null);
        materialA = material(unidadeA, SituacaoMaterial.ATIVO);
        materialB = material(unidadeB, SituacaoMaterial.ATIVO);
        movimentoA1 = movimento(materialA, 3, unidadeB, unidadeA);
        movimentoA2 = movimento(materialA, 2, unidadeA, unidadeB);
        movimentoB = movimento(materialB, 1, unidadeA, unidadeB);
    }

    protected Usuario usuario(int nivel, String setor, String unidade) {
        return tx().execute(status -> {
            Usuario u = new Usuario();
            int numero = ++sequencia;
            u.setMatricula("teste-" + marca + "-" + numero);
            u.setEmail("u" + numero + "." + marca + "@example.invalid");
            u.setNome("Ficticio"); u.setNomeCompleto("Usuario sintetico");
            u.setSenha("hash-ficticio-nao-utilizado-para-login");
            u.setNivel(nivel); u.setSetor(setor); u.setUnidade(unidade);
            u.setAtivo(true); u.setStatusAcesso("liberado");
            u.setDataCadastro(LocalDate.now()); u.setDataModificacao(LocalDateTime.now());
            em.persist(u); usuarios.add(u.getId()); em.flush();
            assertEquals(0L, u.getCredencialVersao());
            assertNotNull(u.getVersaoRegistro());
            return u;
        });
    }

    protected MaterialPatrimonial material(String unidade, SituacaoMaterial situacao) {
        return tx().execute(status -> {
            MaterialPatrimonial m = new MaterialPatrimonial();
            m.setNumeroSerie("SERIE-" + marca + "-" + (++sequencia));
            m.setNome("Material sintetico"); m.setDescricao("Descricao sintetica");
            m.setObservacao("Observacao sintetica"); m.setSetor("P4"); m.setUnidade(unidade);
            m.setDataCadastro(LocalDate.now()); m.setDataModificacao(LocalDateTime.now());
            m.setUsuarioId(autor.getId()); m.setUsuarioModificadorId(autor.getId());
            m.setConferido(false); m.setSituacao(situacao);
            em.persist(m); materiais.add(m.getId()); em.flush(); return m;
        });
    }

    protected Long movimento(MaterialPatrimonial material, int dias, String origem, String destino) {
        return tx().execute(status -> {
            MovimentacaoMaterial m = new MovimentacaoMaterial();
            m.setMaterialId(material.getId()); m.setUsuarioId(autor.getId());
            m.setTipoMovimentacao(TipoMovimentacaoMaterial.TRANSFERENCIA_UNIDADE);
            m.setUnidadeOrigem(origem); m.setUnidadeDestino(destino);
            m.setNumeroDocumento(marca); m.setObservacao("Movimento sintetico");
            em.persist(m); movimentos.add(m.getId()); em.flush();
            em.createNativeQuery("UPDATE TB_movimentacao_material SET dataMovimentacao = :data WHERE ID = :id")
                    .setParameter("data", LocalDateTime.now().minusDays(dias).withNano(0))
                    .setParameter("id", m.getId()).executeUpdate();
            em.clear(); return m.getId();
        });
    }

    protected void alterarUsuario(Usuario usuario, Consumer<Usuario> alteracao) {
        tx().executeWithoutResult(status -> { alteracao.accept(em.find(Usuario.class, usuario.getId())); em.flush(); });
    }
    protected void alterarUnidade(MaterialPatrimonial material, String unidade) {
        tx().executeWithoutResult(status -> { em.find(MaterialPatrimonial.class, material.getId()).setUnidade(unidade); em.flush(); });
    }
    protected MovimentacaoMaterialFiltroDTO filtro(String unidade, Long material, String serie) {
        return new MovimentacaoMaterialFiltroDTO(null, null, null, material, serie, null, null,
                null, null, unidade, marca, null, null, null);
    }
    protected List<Long> ids(List<br.com.rpmont.conferencia.dtos.MovimentacaoMaterialResponseDTO> lista) {
        return lista.stream().map(br.com.rpmont.conferencia.dtos.MovimentacaoMaterialResponseDTO::id).toList();
    }
    protected List<Map<String, Object>> snapshot() {
        JdbcTemplate jdbc = new JdbcTemplate(dataSource);
        List<Map<String, Object>> resultado = new ArrayList<>();
        for (Long id : materiais) resultado.addAll(jdbc.queryForList("SELECT * FROM TB_inventario_MP WHERE ID = ?", id));
        for (Long id : movimentos) resultado.addAll(jdbc.queryForList("SELECT * FROM TB_movimentacao_material WHERE ID = ?", id));
        return resultado;
    }

    @AfterEach
    void limpar() {
        tx().executeWithoutResult(status -> {
            remover(MovimentacaoMaterial.class, movimentos);
            remover(MaterialPatrimonial.class, materiais);
            remover(Usuario.class, usuarios);
            em.flush(); em.clear();
        });
        tx().executeWithoutResult(status -> {
            for (Long id : movimentos) assertNull(em.find(MovimentacaoMaterial.class, id), "Movimento sintetico residual.");
            for (Long id : materiais) assertNull(em.find(MaterialPatrimonial.class, id), "Material sintetico residual.");
            for (Long id : usuarios) assertNull(em.find(Usuario.class, id), "Usuario sintetico residual.");
        });
    }
    private void remover(Class<?> tipo, List<Long> ids) {
        for (Long id : ids) { Object entidade = em.find(tipo, id); if (entidade != null) em.remove(entidade); }
    }
}
