
package br.com.rpmont.conferencia.service;

import br.com.rpmont.conferencia.dtos.ValidarCodigoRecuperacaoRequestDTO;
import br.com.rpmont.conferencia.dtos.RedefinirSenhaRequestDTO;
import br.com.rpmont.conferencia.dtos.SolicitarRecuperacaoSenhaRequestDTO;
import br.com.rpmont.conferencia.exception.RecuperacaoSenhaRejeitadaException;
import br.com.rpmont.conferencia.model.RecuperacaoSenha;
import br.com.rpmont.conferencia.model.Usuario;
import br.com.rpmont.conferencia.repository.RecuperacaoSenhaRepository;
import br.com.rpmont.conferencia.repository.UsuarioRepository;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.parallel.Execution;
import org.junit.jupiter.api.parallel.ExecutionMode;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.aop.support.AopUtils;
import org.springframework.boot.SpringBootConfiguration;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.persistence.autoconfigure.EntityScan;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.context.annotation.Import;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.http.HttpStatus;
import org.springframework.mail.MailSendException;
import org.springframework.orm.jpa.persistenceunit.PersistenceManagedTypes;
import org.springframework.orm.jpa.EntityManagerFactoryUtils;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.mockito.stubbing.Answer;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;
import java.util.List;
import java.util.Comparator;
import java.util.Optional;
import java.util.function.Consumer;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.LockModeType;

import javax.sql.DataSource;
import java.sql.Connection;
import java.net.SocketTimeoutException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

@SpringBootTest(
        classes = RecuperacaoSenhaIntegracaoTest.ConfiguracaoHomologacao.class,
        webEnvironment = SpringBootTest.WebEnvironment.NONE,
        properties = {
                "spring.config.location=classpath:/application-homolog.properties",
                "spring.profiles.include=",
                "spring.datasource.url=jdbc:mysql://127.0.0.1:3307/rpmont_homologacao",
                "spring.datasource.username=rpmont_teste",
                "spring.datasource.password=${RPMONT_HOMOLOG_DB_PASSWORD}",
                "spring.jpa.hibernate.ddl-auto=validate",
                "spring.main.web-application-type=none"
        }
)
@ActiveProfiles("homolog")
@Execution(ExecutionMode.SAME_THREAD)
class RecuperacaoSenhaIntegracaoTest {

    @Autowired
    private DataSource dataSource;

    @Autowired
    private Environment environment;

    @MockitoSpyBean
    private UsuarioRepository usuarioRepository;

    @MockitoSpyBean
    private RecuperacaoSenhaRepository recuperacaoSenhaRepository;

    @Autowired
    private RecuperacaoSenhaServiceImpl recuperacaoSenhaService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockitoBean
    private EmailService emailService;

    @PersistenceContext
    private EntityManager entityManager;

    private boolean workersEncerrados = true;

    @BeforeEach
    void verificarDestinoAntesDeCriarDados() throws Exception {
        deveUtilizarSomenteBancoDeHomologacao();
    }

    @AfterEach
    void removerInstrumentacao() {
        assertTrue(workersEncerrados, "Nao remover instrumentacao enquanto houver workers ativos.");
        reset(usuarioRepository, recuperacaoSenhaRepository, emailService);
    }

    /*
     * =====================================================
     * TESTE 01 - CONEXAO COM O BANCO DE HOMOLOGACAO
     * =====================================================
     */
    @Test
    void deveUtilizarSomenteBancoDeHomologacao() throws Exception {

        assertTrue(
                environment.acceptsProfiles(Profiles.of("homolog"))
        );

        assertFalse(
                environment.acceptsProfiles(Profiles.of("local"))
        );

        assertEquals(
                "jdbc:mysql://127.0.0.1:3307/rpmont_homologacao",
                environment.getRequiredProperty("spring.datasource.url")
        );

        try (Connection conexao = dataSource.getConnection()) {

            assertEquals(
                    "rpmont_homologacao",
                    conexao.getCatalog()
            );

            String jdbcUrl = conexao.getMetaData().getURL();

            assertTrue(
                    jdbcUrl.startsWith(
                            "jdbc:mysql://127.0.0.1:3307/rpmont_homologacao"
                    )
            );

            assertEquals(
                    "127.0.0.1",
                    jdbcUrl.replaceFirst("^jdbc:mysql://", "")
                            .split(":")[0]
            );
        }
    }

    /*
     * =====================================================
     * TESTE 02 - PRIMEIRA TENTATIVA INCORRETA
     *
     * A excecao nao pode desfazer o incremento
     * do contador de tentativas.
     * =====================================================
     */
    @Test
    void devePersistirTentativaInvalidaMesmoAposExcecao() {

        DadosTeste dados = criarDadosTeste(0);

        try {
            validarCodigoIncorreto(dados.email());

            RecuperacaoSenha recuperacaoPersistida =
                    recuperacaoSenhaRepository
                            .findById(dados.recuperacaoId())
                            .orElseThrow();

            assertEquals(
                    1,
                    recuperacaoPersistida.getTentativas()
            );

            assertFalse(
                    recuperacaoPersistida.getUtilizado()
            );

        } finally {
            limparDadosTeste(dados);
        }
    }

    /*
     * =====================================================
     * TESTE 03 - QUINTA TENTATIVA INCORRETA
     *
     * O contador deve chegar a 5 e o codigo
     * deve permanecer invalidado no banco,
     * mesmo apos a excecao.
     * =====================================================
     */
    @Test
    void deveInvalidarCodigoNaQuintaTentativaMesmoAposExcecao() {

        DadosTeste dados = criarDadosTeste(4);

        try {
            validarCodigoIncorreto(dados.email());

            RecuperacaoSenha recuperacaoPersistida =
                    recuperacaoSenhaRepository
                            .findById(dados.recuperacaoId())
                            .orElseThrow();

            assertEquals(
                    5,
                    recuperacaoPersistida.getTentativas()
            );

            assertTrue(
                    recuperacaoPersistida.getUtilizado()
            );

        } finally {
            limparDadosTeste(dados);
        }
    }


    /*
     * =====================================================
     * TESTE 04 - EXPIRACAO DO CODIGO
     *
     * Um codigo expirado deve permanecer invalidado
     * no MySQL mesmo apos a excecao HTTP 400.
     * =====================================================
     */
    @Test
    void devePersistirInvalidacaoDeCodigoExpiradoMesmoAposExcecao() {

        DadosTeste dados = criarDadosTeste(0);

        try {
            RecuperacaoSenha recuperacao =
                    recuperacaoSenhaRepository
                            .findById(dados.recuperacaoId())
                            .orElseThrow();

            // Simula um codigo expirado ha cinco minutos.
            recuperacao.setDataExpiracao(
                    LocalDateTime.now().minusMinutes(5)
            );

            recuperacaoSenhaRepository.saveAndFlush(recuperacao);

            // O codigo esta correto, mas ja expirou.
            RecuperacaoSenhaRejeitadaException excecao =
                    assertThrows(
                            RecuperacaoSenhaRejeitadaException.class,
                            () -> recuperacaoSenhaService.validarCodigo(
                                    new ValidarCodigoRecuperacaoRequestDTO(
                                            dados.email(),
                                            "123456"
                                    )
                            )
                    );

            assertEquals(
                    HttpStatus.BAD_REQUEST,
                    excecao.getStatusCode()
            );

            // Consulta o registro depois da excecao.
            RecuperacaoSenha recuperacaoPersistida =
                    recuperacaoSenhaRepository
                            .findById(dados.recuperacaoId())
                            .orElseThrow();

            assertTrue(
                    recuperacaoPersistida.getUtilizado(),
                    "O codigo expirado deve permanecer invalidado."
            );

            assertEquals(
                    0,
                    recuperacaoPersistida.getTentativas(),
                    "A expiracao nao deve incrementar as tentativas."
            );

        } finally {
            limparDadosTeste(dados);
        }
    }

    /*
     * =====================================================
     * METODO AUXILIAR - VALIDAR CODIGO INCORRETO
     * =====================================================
     */
    private void validarCodigoIncorreto(String email) {

        RecuperacaoSenhaRejeitadaException excecao =
                assertThrows(
                        RecuperacaoSenhaRejeitadaException.class,
                        () -> recuperacaoSenhaService.validarCodigo(
                                new ValidarCodigoRecuperacaoRequestDTO(
                                        email,
                                        "999999"
                                )
                        )
                );

        assertEquals(
                HttpStatus.BAD_REQUEST,
                excecao.getStatusCode()
        );
    }

    /*
     * =====================================================
     * METODO AUXILIAR - CRIAR DADOS FICTICIOS
     * =====================================================
     */
    private DadosTeste criarDadosTeste(int tentativasIniciais) {

        String identificador = UUID.randomUUID()
                .toString()
                .substring(0, 8);

        String email = "homolog-" + identificador
                + "@example.invalid";

        Usuario usuario = new Usuario();

        usuario.setMatricula("HOMOLOG-" + identificador);
        usuario.setNome("TESTE");
        usuario.setNomeCompleto("USUARIO HOMOLOGACAO");
        usuario.setEmail(email);
        usuario.setSenha(
                passwordEncoder.encode("SenhaTeste123")
        );
        usuario.setNivel(3);
        usuario.setStatusAcesso("LIBERADO");
        usuario.setAtivo(true);
        usuario.setDataCadastro(LocalDate.now());
        usuario.setDataModificacao(LocalDateTime.now());

        usuario = usuarioRepository.saveAndFlush(usuario);

        RecuperacaoSenha recuperacao = new RecuperacaoSenha();

        recuperacao.setUsuario(usuario);
        recuperacao.setCodigoHash(
                passwordEncoder.encode("123456")
        );
        recuperacao.setDataCriacao(LocalDateTime.now());
        recuperacao.setDataExpiracao(
                LocalDateTime.now().plusMinutes(10)
        );
        recuperacao.setUtilizado(false);
        recuperacao.setTentativas(tentativasIniciais);

        recuperacao = recuperacaoSenhaRepository
                .saveAndFlush(recuperacao);

        return new DadosTeste(
                email,
                usuario.getId(),
                recuperacao.getId()
        );
    }

    /*
     * =====================================================
     * METODO AUXILIAR - LIMPAR DADOS DE HOMOLOGACAO
     * =====================================================
     */
    private void limparDadosTeste(DadosTeste dados) {

        assertTrue(workersEncerrados, "Nao limpar fixtures enquanto houver workers ativos.");

        // Inclui recuperacoes criadas durante os testes de nova solicitacao.
        for (RecuperacaoSenha recuperacao : recuperacoesDoTeste(dados)) {
            recuperacaoSenhaRepository.deleteById(recuperacao.getId());
        }

        usuarioRepository.deleteById(
                dados.usuarioId()
        );
    }

    /*
     * =====================================================
     * IDENTIFICADORES DOS DADOS FICTICIOS
     * =====================================================
     */
    private record DadosTeste(
            String email,
            Long usuarioId,
            Long recuperacaoId
    ) {
    }

    /*
     * =====================================================
     * TESTE 05 - CONCORRENCIA ENTRE DUAS REQUISICOES
     *
     * Duas chamadas simultaneas com codigos incorretos
     * devem registrar duas tentativas no MySQL.
     * =====================================================
     */
    @Test
    void deveRegistrarDuasTentativasConcorrentesSemPerderAtualizacoes()
            throws Exception {

        DadosTeste dados = criarDadosTeste(0);

        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch inicio = new CountDownLatch(1);

        try {
            Future<?> requisicaoA = executor.submit(() -> {
                try {
                    inicio.await();
                    validarCodigoIncorreto(dados.email());
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException(e);
                }
            });

            Future<?> requisicaoB = executor.submit(() -> {
                try {
                    inicio.await();
                    validarCodigoIncorreto(dados.email());
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException(e);
                }
            });

            // Libera as duas requisicoes simultaneamente.
            inicio.countDown();

            // Aguarda ambas e propaga eventuais falhas.
            requisicaoA.get(30, TimeUnit.SECONDS);
            requisicaoB.get(30, TimeUnit.SECONDS);

            RecuperacaoSenha recuperacaoPersistida =
                    recuperacaoSenhaRepository
                            .findById(dados.recuperacaoId())
                            .orElseThrow();

            assertEquals(
                    2,
                    recuperacaoPersistida.getTentativas(),
                    "As duas tentativas devem ser registradas."
            );

            assertFalse(
                    recuperacaoPersistida.getUtilizado(),
                    "O codigo nao deve ser invalidado com apenas duas tentativas."
            );

        } finally {
            inicio.countDown();
            executor.shutdownNow();

            if (executor.awaitTermination(30, TimeUnit.SECONDS)) {
                limparDadosTeste(dados);
            }
        }
    }

    // TESTE 06 - SUCESSO, BCRYPT E USO UNICO
    @Test
    void deveRedefinirSenhaComBcryptEConsumirCodigo() {
        DadosTeste dados = criarDadosTeste(0);
        try {
            String hashAnterior = usuarioDoTeste(dados).getSenha();
            redefinir(dados, "123456", "NovaSenhaHomologA123");
            String hashAtual = usuarioDoTeste(dados).getSenha();
            assertTrue(!hashAnterior.equals(hashAtual), "O hash deve mudar.");
            assertTrue(hashAtual.matches("^\\$2[aby]\\$\\d{2}\\$[./A-Za-z0-9]{53}$"),
                    "O hash persistido deve ter formato BCrypt.");
            assertTrue(passwordEncoder.matches("NovaSenhaHomologA123", hashAtual));
            assertFalse(passwordEncoder.matches("SenhaTeste123", hashAtual));
            assertTrue(!"NovaSenhaHomologA123".equals(hashAtual));
            assertTrue(recuperacaoDoTeste(dados).getUtilizado());
            assertEquals(0, recuperacaoDoTeste(dados).getTentativas());

            exigirRejeicao(() -> redefinir(dados, "123456", "NovaSenhaHomologB123"));
            assertTrue(hashAtual.equals(usuarioDoTeste(dados).getSenha()),
                    "A reutilizacao nao pode mudar a senha.");
        } finally {
            limparDadosTeste(dados);
        }
    }

    // TESTE 07 - QUINTA TENTATIVA NA REDEFINICAO
    @Test
    void deveInvalidarNaQuintaTentativaDeRedefinicaoSemAlterarSenha() {
        DadosTeste dados = criarDadosTeste(4);
        try {
            String hashAnterior = usuarioDoTeste(dados).getSenha();
            RecuperacaoSenhaRejeitadaException rejeicao = assertThrows(
                    RecuperacaoSenhaRejeitadaException.class,
                    () -> redefinir(dados, "999999", "NovaSenhaHomologA123"));
            assertEquals(HttpStatus.BAD_REQUEST, rejeicao.getStatusCode());
            assertEquals(5, recuperacaoDoTeste(dados).getTentativas());
            assertTrue(recuperacaoDoTeste(dados).getUtilizado());
            assertTrue(hashAnterior.equals(usuarioDoTeste(dados).getSenha()));
            exigirRejeicao(() -> redefinir(dados, "123456", "NovaSenhaHomologA123"));
            assertTrue(hashAnterior.equals(usuarioDoTeste(dados).getSenha()));
            assertEquals(5, recuperacaoDoTeste(dados).getTentativas());
        } finally {
            limparDadosTeste(dados);
        }
    }

    // TESTE 08 - FALHA DEPOIS DO FLUSH, ANTES DO COMMIT
    @Test
    void deveDesfazerSenhaEConsumoDoCodigoAposFalhaInesperada() {
        DadosTeste dados = criarDadosTeste(0);
        AtomicBoolean enviadoAoMysql = new AtomicBoolean();
        FalhaHomologacaoException falha = new FalhaHomologacaoException();
        // O spy de uma interface Spring Data delega ao proxy; nao ha corpo Java
        // concreto para InvocationOnMock.callRealMethod() executar.
        Answer<?> salvarNoRepositorioReal = mockingDetails(recuperacaoSenhaRepository)
                .getMockCreationSettings().getDefaultAnswer();
        try {
            String hashAnterior = usuarioDoTeste(dados).getSenha();
            LocalDateTime modificacaoAnterior = usuarioDoTeste(dados).getDataModificacao();
            String codigoHashAnterior = recuperacaoDoTeste(dados).getCodigoHash();
            doAnswer(invocacao -> {
                RecuperacaoSenha recuperacao = invocacao.getArgument(0);
                exigirTransacaoRealDoServico();
                Object salvo = salvarNoRepositorioReal.answer(invocacao);
                if (dados.recuperacaoId().equals(recuperacao.getId())
                        && Boolean.TRUE.equals(recuperacao.getUtilizado())) {
                    // O flush do contexto envia AMBAS as alteracoes na transacao do servico.
                    recuperacaoSenhaRepository.flush();
                    Number alteracoes = (Number) entityManager.createNativeQuery("""
                            select count(*) from usuarios_sistema u
                            join recuperacao_senha r on r.usuario_id = u.ID
                            where u.ID = :usuarioId and r.id = :recuperacaoId
                            and u.SENHA <> :hashAnterior and r.utilizado = true
                            """)
                            .setParameter("usuarioId", dados.usuarioId())
                            .setParameter("recuperacaoId", dados.recuperacaoId())
                            .setParameter("hashAnterior", hashAnterior)
                            .getSingleResult();
                    assertTrue(alteracoes.intValue() == 1,
                            "Ambas as alteracoes devem estar no MySQL antes da falha.");
                    enviadoAoMysql.set(true);
                    throw falha;
                }
                return salvo;
            }).when(recuperacaoSenhaRepository).save(any(RecuperacaoSenha.class));

            FalhaHomologacaoException recebida = assertThrows(FalhaHomologacaoException.class,
                    () -> redefinir(dados, "123456", "NovaSenhaHomologA123"));
            assertSame(falha, recebida);
            assertTrue(enviadoAoMysql.get(), "A falha deve ocorrer depois do flush real.");
            assertTrue(hashAnterior.equals(usuarioDoTeste(dados).getSenha()));
            assertEquals(modificacaoAnterior, usuarioDoTeste(dados).getDataModificacao());
            assertFalse(recuperacaoDoTeste(dados).getUtilizado());
            assertTrue(codigoHashAnterior.equals(recuperacaoDoTeste(dados).getCodigoHash()));
            assertEquals(0, recuperacaoDoTeste(dados).getTentativas());

            reset(recuperacaoSenhaRepository);
            redefinir(dados, "123456", "NovaSenhaHomologA123");
            assertTrue(recuperacaoDoTeste(dados).getUtilizado());
            assertTrue(passwordEncoder.matches("NovaSenhaHomologA123", usuarioDoTeste(dados).getSenha()));
        } finally {
            reset(recuperacaoSenhaRepository);
            limparDadosTeste(dados);
        }
    }

    // TESTE 09 - SOMENTE UMA REDEFINICAO PODE CONSUMIR O CODIGO
    @Test
    void devePermitirSomenteUmaRedefinicaoConcorrente() throws Exception {
        DadosTeste dados = criarDadosTeste(0);
        try {
            executarDisputa(dados,
                    () -> redefinir(dados, "123456", "NovaSenhaHomologA123"),
                    () -> exigirRejeicao(() -> redefinir(dados, "123456", "NovaSenhaHomologB123")));
            String hash = usuarioDoTeste(dados).getSenha();
            assertTrue(passwordEncoder.matches("NovaSenhaHomologA123", hash));
            assertFalse(passwordEncoder.matches("NovaSenhaHomologB123", hash));
            assertTrue(recuperacaoDoTeste(dados).getUtilizado());
            assertEquals(0, recuperacaoDoTeste(dados).getTentativas());
        } finally {
            limparDadosTeste(dados);
        }
    }

    // TESTE 10 - REDEFINICAO ADQUIRE O BLOQUEIO ANTES DA SOLICITACAO
    @Test
    void deveSolicitarNovoCodigoAposRedefinicaoConcorrente() throws Exception {
        DadosTeste dados = criarDadosTeste(0);
        AtomicReference<String> codigoEnviado = new AtomicReference<>();
        try {
            envelhecerSolicitacao(dados);
            doAnswer(invocacao -> {
                codigoEnviado.set(invocacao.getArgument(1));
                return null;
            }).when(emailService).enviarCodigoRecuperacao(eq(dados.email()), anyString());
            executarDisputa(dados,
                    () -> redefinir(dados, "123456", "NovaSenhaHomologA123"),
                    () -> recuperacaoSenhaService.solicitarRecuperacao(
                            new SolicitarRecuperacaoSenhaRequestDTO(dados.email())));
            assertTrue(passwordEncoder.matches("NovaSenhaHomologA123", usuarioDoTeste(dados).getSenha()));
            verificarNovoCodigo(dados, codigoEnviado.get(), 0);
            assertEquals(1, mockingDetails(emailService).getInvocations().size(),
                    "Deve ocorrer exatamente um envio simulado.");
        } finally {
            limparDadosTeste(dados);
        }
    }

    // TESTE 11 - SOLICITACAO ADQUIRE O BLOQUEIO ANTES DA REDEFINICAO
    @Test
    void deveRejeitarCodigoAntigoAposSolicitacaoConcorrente() throws Exception {
        DadosTeste dados = criarDadosTeste(0);
        AtomicReference<String> codigoEnviado = new AtomicReference<>();
        AtomicReference<String> codigoAntigo = new AtomicReference<>();
        try {
            envelhecerSolicitacao(dados);
            String hashAnterior = usuarioDoTeste(dados).getSenha();
            executarDisputa(dados,
                    () -> recuperacaoSenhaService.solicitarRecuperacao(
                            new SolicitarRecuperacaoSenhaRequestDTO(dados.email())),
                    () -> exigirRejeicao(() -> redefinir(dados, codigoAntigo.get(), "NovaSenhaHomologA123")),
                    novoCodigo -> {
                        codigoEnviado.set(novoCodigo);
                        // Fixture deterministica, na transacao da solicitacao e antes do commit.
                        String antigo = "123456".equals(novoCodigo) ? "654321" : "123456";
                        codigoAntigo.set(antigo);
                        RecuperacaoSenha recuperacao = recuperacaoDoTeste(dados);
                        recuperacao.setCodigoHash(passwordEncoder.encode(antigo));
                        recuperacaoSenhaRepository.saveAndFlush(recuperacao);
                    });
            assertTrue(hashAnterior.equals(usuarioDoTeste(dados).getSenha()));
            verificarNovoCodigo(dados, codigoEnviado.get(), 1);
            assertEquals(1, mockingDetails(emailService).getInvocations().size(),
                    "Deve ocorrer exatamente um envio simulado.");
        } finally {
            limparDadosTeste(dados);
        }
    }

    // TESTE 12 - ESTADO DO CODIGO NAO ELIMINA O INTERVALO
    @ParameterizedTest
    @ValueSource(strings = {"ATIVO", "UTILIZADO", "INVALIDADO", "EXPIRADO", "EXPIRADO_INVALIDADO"})
    void deveBloquearSolicitacaoRecenteIndependentementeDoEstado(String estado) {
        DadosTeste dados = criarDadosTeste(0);
        try {
            prepararEstadoIntervalo(dados, estado, 5);
            EstadoIntervalo antes = estadoIntervalo(dados);
            exigirIntervalo(dados);
            exigirIntervalo(dados);
            verificarRejeicaoSemAlteracoes(dados, antes);
        } finally {
            limparDadosTeste(dados);
        }
    }

    // TESTE 13 - QUINTA TENTATIVA REAL NAO PERMITE REENVIO IMEDIATO
    @Test
    void deveBloquearReenvioDepoisDaQuintaTentativaIncorreta() {
        DadosTeste dados = criarDadosTeste(4);
        try {
            validarCodigoIncorreto(dados.email());
            assertEquals(5, recuperacaoDoTeste(dados).getTentativas());
            assertTrue(recuperacaoDoTeste(dados).getUtilizado());
            EstadoIntervalo antes = estadoIntervalo(dados);
            exigirIntervalo(dados);
            verificarRejeicaoSemAlteracoes(dados, antes);
        } finally {
            limparDadosTeste(dados);
        }
    }

    // TESTE 14 - CONSUMO REAL DO CODIGO NAO PERMITE REENVIO IMEDIATO
    @Test
    void deveBloquearReenvioImediatoDepoisDeRedefinirSenha() {
        DadosTeste dados = criarDadosTeste(0);
        try {
            redefinir(dados, "123456", "NovaSenhaHomologA123");
            assertTrue(recuperacaoDoTeste(dados).getUtilizado());
            assertTrue(passwordEncoder.matches("NovaSenhaHomologA123", usuarioDoTeste(dados).getSenha()));
            EstadoIntervalo antes = estadoIntervalo(dados);
            exigirIntervalo(dados);
            verificarRejeicaoSemAlteracoes(dados, antes);
        } finally {
            limparDadosTeste(dados);
        }
    }

    // TESTE 15 - HISTORICO ANTIGO NAO PODE OCULTAR SOLICITACAO RECENTE UTILIZADA
    @Test
    void deveConsiderarSolicitacaoRecenteUtilizadaMesmoComCodigoAntigoAtivo() {
        DadosTeste dados = criarDadosTeste(0);
        try {
            envelhecerSolicitacao(dados);
            criarRecuperacaoAdicional(dados, LocalDateTime.now().withNano(0), true);
            EstadoIntervalo antes = estadoIntervalo(dados);
            exigirIntervalo(dados);
            verificarRejeicaoSemAlteracoes(dados, antes);
        } finally {
            limparDadosTeste(dados);
        }
    }

    // TESTE 16 - DESEMPATE POR ID NA CONSULTA REAL DO MYSQL
    @Test
    void deveSelecionarMaiorIdQuandoDatasDeCriacaoForemIguais() {
        DadosTeste dados = criarDadosTeste(0);
        try {
            prepararEstadoIntervalo(dados, "ATIVO", 5);
            LocalDateTime criacao = recuperacaoDoTeste(dados).getDataCriacao();
            RecuperacaoSenha adicional = criarRecuperacaoAdicional(dados, criacao, true);
            RecuperacaoSenha ultima = recuperacaoSenhaRepository
                    .findTopByUsuarioOrderByDataCriacaoDescIdDesc(usuarioDoTeste(dados)).orElseThrow();
            assertEquals(adicional.getId(), ultima.getId());
            EstadoIntervalo antes = estadoIntervalo(dados);
            exigirIntervalo(dados);
            verificarRejeicaoSemAlteracoes(dados, antes);
        } finally {
            limparDadosTeste(dados);
        }
    }

    // TESTE 17 - PRAZO CUMPRIDO PERMITE REENVIO EM QUALQUER ESTADO
    @ParameterizedTest
    @ValueSource(strings = {"ATIVO", "UTILIZADO", "INVALIDADO", "EXPIRADO", "EXPIRADO_INVALIDADO"})
    void devePermitirReenvioAposIntervaloIndependentementeDoEstado(String estado) {
        DadosTeste dados = criarDadosTeste(0);
        try {
            // Para expirados, reproduzir tambem a duracao normal de dez minutos.
            prepararEstadoIntervalo(dados, estado, estado.startsWith("EXPIRADO") ? 660 : 120);
            String senhaAnterior = usuarioDoTeste(dados).getSenha();
            RecuperacaoSenha anterior = recuperacaoDoTeste(dados);
            solicitar(dados);
            RecuperacaoSenha preservada = recuperacaoDoTeste(dados);
            assertTrue(preservada.getUtilizado());
            assertTrue(anterior.getCodigoHash().equals(preservada.getCodigoHash()));
            assertEquals(anterior.getDataCriacao(), preservada.getDataCriacao());
            assertEquals(anterior.getDataExpiracao(), preservada.getDataExpiracao());
            assertEquals(anterior.getTentativas(), preservada.getTentativas());
            assertTrue(senhaAnterior.equals(usuarioDoTeste(dados).getSenha()));
            verificarSolicitacaoUnica(dados, 2);
        } finally {
            limparDadosTeste(dados);
        }
    }

    // TESTE 18 - PRIMEIRA SOLICITACAO SEM HISTORICO
    @Test
    void devePermitirSolicitacaoSemHistoricoDeRecuperacao() {
        DadosTeste dados = criarDadosTeste(0);
        try {
            recuperacaoSenhaRepository.deleteById(dados.recuperacaoId());
            solicitar(dados);
            verificarSolicitacaoUnica(dados, 1);
        } finally {
            limparDadosTeste(dados);
        }
    }

    // TESTE 19 - DUAS SOLICITACOES ELEGIVEIS PRODUZEM SOMENTE UM ENVIO
    @ParameterizedTest
    @ValueSource(booleans = {true, false})
    void devePermitirSomenteUmaSolicitacaoConcorrente(boolean semHistorico) throws Exception {
        DadosTeste dados = criarDadosTeste(0);
        try {
            if (semHistorico) {
                recuperacaoSenhaRepository.deleteById(dados.recuperacaoId());
            } else {
                envelhecerSolicitacao(dados);
            }
            String senhaAnterior = usuarioDoTeste(dados).getSenha();
            executarDisputa(dados, () -> solicitar(dados), () -> exigirIntervalo(dados));
            assertTrue(senhaAnterior.equals(usuarioDoTeste(dados).getSenha()));
            verificarSolicitacaoUnica(dados, semHistorico ? 1 : 2);
            if (!semHistorico) {
                assertTrue(recuperacaoDoTeste(dados).getUtilizado());
            }
        } finally {
            limparDadosTeste(dados);
        }
    }

    // TESTE 20 - REENVIOS CONCORRENTES NAO CONTORNAM A QUINTA TENTATIVA
    @Test
    void deveBloquearReenviosConcorrentesAposQuintaTentativa() throws Exception {
        DadosTeste dados = criarDadosTeste(4);
        try {
            validarCodigoIncorreto(dados.email());
            assertEquals(5, recuperacaoDoTeste(dados).getTentativas());
            assertTrue(recuperacaoDoTeste(dados).getUtilizado());
            EstadoIntervalo antes = estadoIntervalo(dados);
            executarDisputa(dados, () -> exigirIntervalo(dados), () -> exigirIntervalo(dados));
            verificarRejeicaoSemAlteracoes(dados, antes);
        } finally {
            limparDadosTeste(dados);
        }
    }

    // TESTE 21 - FALHAS SMTP DESFAZEM A NOVA SOLICITACAO E RESTAURAM O CODIGO ANTERIOR
    @ParameterizedTest
    @ValueSource(strings = {"CONEXAO", "LEITURA", "ESCRITA"})
    void deveDesfazerSolicitacaoAposTimeoutSmtpSimulado(String operacao) {
        DadosTeste dados = criarDadosTeste(0);
        AtomicBoolean alteracoesEnviadasAoMysql = new AtomicBoolean();
        MailSendException falha = new MailSendException("Falha SMTP simulada de " + operacao,
                new SocketTimeoutException("Timeout controlado de homologacao."));
        try {
            envelhecerSolicitacao(dados);
            EstadoIntervalo antes = estadoIntervalo(dados);
            doAnswer(invocacao -> {
                exigirTransacaoRealDoServico();
                // Forca o INSERT e a invalidacao anterior antes de simular a falha SMTP.
                recuperacaoSenhaRepository.flush();
                Number registros = (Number) entityManager.createNativeQuery(
                                "select count(*) from recuperacao_senha where usuario_id = :usuarioId")
                        .setParameter("usuarioId", dados.usuarioId()).getSingleResult();
                Number anterioresInvalidados = (Number) entityManager.createNativeQuery(
                                "select count(*) from recuperacao_senha where id = :id and utilizado = true")
                        .setParameter("id", dados.recuperacaoId()).getSingleResult();
                assertTrue(registros.intValue() == antes.codigos().size() + 1,
                        "O novo registro deve ter sido enviado ao MySQL antes da falha.");
                assertTrue(anterioresInvalidados.intValue() == 1,
                        "O codigo anterior deve estar invalidado dentro da transacao.");
                alteracoesEnviadasAoMysql.set(true);
                throw falha;
            }).when(emailService).enviarCodigoRecuperacao(eq(dados.email()), anyString());

            MailSendException recebida = assertThrows(MailSendException.class, () -> solicitar(dados));
            assertSame(falha, recebida);
            assertTrue(alteracoesEnviadasAoMysql.get(), "A falha deve ocorrer depois do flush real.");
            assertTrue(antes.equals(estadoIntervalo(dados)),
                    "O rollback deve restaurar senha, codigos, tentativas e datas anteriores.");
            assertEquals(1, mockingDetails(emailService).getInvocations().size());

            // O codigo anterior continua valido e a tentativa desfeita nao reinicia o intervalo.
            reset(emailService);
            recuperacaoSenhaService.validarCodigo(new ValidarCodigoRecuperacaoRequestDTO(dados.email(), "123456"));
            assertTrue(antes.equals(estadoIntervalo(dados)));
            solicitar(dados);
            verificarSolicitacaoUnica(dados, 2);
        } finally {
            reset(emailService);
            limparDadosTeste(dados);
        }
    }

    private void solicitar(DadosTeste dados) {
        recuperacaoSenhaService.solicitarRecuperacao(new SolicitarRecuperacaoSenhaRequestDTO(dados.email()));
    }

    private void exigirIntervalo(DadosTeste dados) {
        ResponseStatusException rejeicao = assertThrows(ResponseStatusException.class, () -> solicitar(dados));
        assertEquals(HttpStatus.TOO_MANY_REQUESTS, rejeicao.getStatusCode());
    }

    private void prepararEstadoIntervalo(DadosTeste dados, String estado, long idadeSegundos) {
        RecuperacaoSenha recuperacao = recuperacaoDoTeste(dados);
        LocalDateTime agora = LocalDateTime.now();
        recuperacao.setDataCriacao(agora.minusSeconds(idadeSegundos).withNano(0));
        // A expiracao recente e uma fixture artificial para provar independencia do estado.
        // No caso normal de expiracao, manter a validade original de dez minutos.
        recuperacao.setDataExpiracao(estado.startsWith("EXPIRADO")
                ? (idadeSegundos >= 600 ? recuperacao.getDataCriacao().plusMinutes(10)
                        : agora.minusSeconds(1).withNano(0))
                : recuperacao.getDataCriacao().plusMinutes(10));
        recuperacao.setUtilizado(estado.equals("UTILIZADO") || estado.contains("INVALIDADO"));
        recuperacao.setTentativas(estado.contains("INVALIDADO") ? 5 : 0);
        recuperacaoSenhaRepository.saveAndFlush(recuperacao);
    }

    private RecuperacaoSenha criarRecuperacaoAdicional(DadosTeste dados, LocalDateTime criacao,
                                                      boolean utilizado) {
        RecuperacaoSenha original = recuperacaoDoTeste(dados);
        RecuperacaoSenha adicional = new RecuperacaoSenha();
        adicional.setUsuario(usuarioDoTeste(dados));
        adicional.setCodigoHash(original.getCodigoHash());
        adicional.setDataCriacao(criacao);
        adicional.setDataExpiracao(criacao.plusMinutes(10));
        adicional.setUtilizado(utilizado);
        adicional.setTentativas(0);
        return recuperacaoSenhaRepository.saveAndFlush(adicional);
    }

    private EstadoIntervalo estadoIntervalo(DadosTeste dados) {
        Usuario usuario = usuarioDoTeste(dados);
        List<EstadoCodigoIntervalo> codigos = recuperacoesDoTeste(dados).stream()
                .sorted(Comparator.comparing(RecuperacaoSenha::getId))
                .map(r -> new EstadoCodigoIntervalo(r.getId(), r.getCodigoHash(), r.getDataCriacao(),
                        r.getDataExpiracao(), r.getUtilizado(), r.getTentativas()))
                .toList();
        return new EstadoIntervalo(usuario.getSenha(), usuario.getDataModificacao(), codigos);
    }

    private void verificarRejeicaoSemAlteracoes(DadosTeste dados, EstadoIntervalo antes) {
        // Comparacao booleana para nao incluir hashes nas mensagens de falha.
        assertTrue(antes.equals(estadoIntervalo(dados)), "A rejeicao nao deve modificar os dados persistidos.");
        assertTrue(mockingDetails(emailService).getInvocations().isEmpty(), "Rejeicoes nao devem enviar e-mail.");
    }

    private void verificarSolicitacaoUnica(DadosTeste dados, int quantidadeRegistros) {
        List<RecuperacaoSenha> todas = recuperacoesDoTeste(dados);
        assertEquals(quantidadeRegistros, todas.size());
        List<RecuperacaoSenha> ativas = todas.stream()
                .filter(r -> Boolean.FALSE.equals(r.getUtilizado())).toList();
        assertEquals(1, ativas.size());
        assertFalse(dados.recuperacaoId().equals(ativas.getFirst().getId()));
        assertEquals(0, ativas.getFirst().getTentativas());
        assertEquals(1, mockingDetails(emailService).getInvocations().size(), "Deve ocorrer somente um envio.");
    }

    private record EstadoIntervalo(String senha, LocalDateTime modificacao, List<EstadoCodigoIntervalo> codigos) {
    }

    private record EstadoCodigoIntervalo(Long id, String hash, LocalDateTime criacao, LocalDateTime expiracao,
                                       Boolean utilizado, Integer tentativas) {
    }

    private Usuario usuarioDoTeste(DadosTeste dados) {
        return usuarioRepository.findById(dados.usuarioId()).orElseThrow();
    }

    private RecuperacaoSenha recuperacaoDoTeste(DadosTeste dados) {
        return recuperacaoSenhaRepository.findById(dados.recuperacaoId()).orElseThrow();
    }

    private List<RecuperacaoSenha> recuperacoesDoTeste(DadosTeste dados) {
        return entityManager.createQuery(
                        "select r from RecuperacaoSenha r where r.usuario.id = :usuarioId",
                        RecuperacaoSenha.class)
                .setParameter("usuarioId", dados.usuarioId())
                .getResultList();
    }

    private void redefinir(DadosTeste dados, String codigo, String senha) {
        recuperacaoSenhaService.redefinirSenha(
                new RedefinirSenhaRequestDTO(dados.email(), codigo, senha, senha));
    }

    private void exigirRejeicao(Runnable operacao) {
        ResponseStatusException rejeicao = assertThrows(ResponseStatusException.class, operacao::run);
        assertEquals(HttpStatus.BAD_REQUEST, rejeicao.getStatusCode());
    }

    private void envelhecerSolicitacao(DadosTeste dados) {
        RecuperacaoSenha recuperacao = recuperacaoDoTeste(dados);
        recuperacao.setDataCriacao(LocalDateTime.now().minusMinutes(2));
        recuperacaoSenhaRepository.saveAndFlush(recuperacao);
    }

    private void verificarNovoCodigo(DadosTeste dados, String codigo, int tentativas) {
        assertNotNull(codigo, "O SMTP simulado deve receber o novo codigo.");
        List<RecuperacaoSenha> todas = recuperacoesDoTeste(dados);
        assertEquals(2, todas.size());
        assertTrue(recuperacaoDoTeste(dados).getUtilizado());
        List<RecuperacaoSenha> ativas = todas.stream()
                .filter(r -> Boolean.FALSE.equals(r.getUtilizado())).toList();
        assertEquals(1, ativas.size());
        RecuperacaoSenha nova = ativas.getFirst();
        assertFalse(dados.recuperacaoId().equals(nova.getId()));
        assertTrue(passwordEncoder.matches(codigo, nova.getCodigoHash()));
        assertEquals(tentativas, nova.getTentativas());
    }

    private void aguardar(CountDownLatch sinal) throws InterruptedException {
        assertTrue(sinal.await(10, TimeUnit.SECONDS), "Tempo limite de sincronizacao excedido.");
    }

    private EntityManager exigirTransacaoRealDoServico() {
        assertTrue(AopUtils.isAopProxy(recuperacaoSenhaService),
                "A chamada deve atravessar o proxy Spring do servico.");
        assertFalse(mockingDetails(recuperacaoSenhaService).isMock(),
                "O servico deve ser real.");
        assertTrue(TransactionSynchronizationManager.isActualTransactionActive(),
                "O worker deve executar dentro da transacao real do servico.");
        EntityManager contexto = EntityManagerFactoryUtils.getTransactionalEntityManager(
                entityManager.getEntityManagerFactory());
        assertNotNull(contexto, "Deve existir um contexto JPA vinculado a thread.");
        assertTrue(contexto.isJoinedToTransaction(), "O contexto JPA deve participar da transacao.");
        return contexto;
    }

    private void aguardarSinalDoWorker(CountDownLatch sinal, Future<?>... workers) throws Exception {
        long limite = System.nanoTime() + TimeUnit.SECONDS.toNanos(10);
        while (!sinal.await(50, TimeUnit.MILLISECONDS)) {
            // Nao esconder uma falha anterior ao countDown atras de um timeout.
            for (Future<?> worker : workers) {
                if (worker.isDone()) {
                    worker.get();
                }
            }
            assertTrue(System.nanoTime() < limite, "Tempo limite de sincronizacao excedido.");
        }
        for (Future<?> worker : workers) {
            if (worker.isDone()) {
                worker.get();
            }
        }
    }

    private void executarDisputa(DadosTeste dados, Runnable primeira, Runnable segunda) throws Exception {
        executarDisputa(dados, primeira, segunda, null);
    }

    private void executarDisputa(DadosTeste dados, Runnable primeira, Runnable segunda,
                                Consumer<String> prepararEnvio) throws Exception {
        CountDownLatch primeiroBloqueou = new CountDownLatch(1);
        CountDownLatch liberarPrimeiro = new CountDownLatch(1);
        CountDownLatch segundoEntrou = new CountDownLatch(1);
        CountDownLatch segundoBloqueou = new CountDownLatch(1);
        AtomicInteger chamadas = new AtomicInteger();
        AtomicReference<EntityManager> primeiroContexto = new AtomicReference<>();
        Answer<?> consultarNoRepositorioReal = mockingDetails(usuarioRepository)
                .getMockCreationSettings().getDefaultAnswer();
        ExecutorService executor = Executors.newFixedThreadPool(2);
        Future<?> a = null;
        Future<?> b = null;
        Throwable falhaPrincipal = null;
        try {
            if (prepararEnvio != null) {
                doAnswer(invocacao -> {
                    prepararEnvio.accept(invocacao.getArgument(1));
                    primeiroBloqueou.countDown();
                    aguardar(liberarPrimeiro);
                    return null;
                }).when(emailService).enviarCodigoRecuperacao(eq(dados.email()), anyString());
            }
            doAnswer(invocacao -> {
                EntityManager contexto = exigirTransacaoRealDoServico();
                int ordem = chamadas.incrementAndGet();
                if (ordem == 1) {
                    primeiroContexto.set(contexto);
                }
                if (ordem == 2) {
                    assertTrue(primeiroContexto.get() != contexto,
                            "Os workers devem usar contextos JPA distintos.");
                    segundoEntrou.countDown();
                }
                // Executa a query original, incluindo @Lock e os interceptores JPA.
                Optional<?> usuario = (Optional<?>) consultarNoRepositorioReal.answer(invocacao);
                assertEquals(LockModeType.PESSIMISTIC_WRITE,
                        contexto.getLockMode(usuario.orElseThrow()));
                if (ordem == 1 && prepararEnvio == null) {
                    primeiroBloqueou.countDown();
                    aguardar(liberarPrimeiro);
                } else if (ordem == 2) {
                    segundoBloqueou.countDown();
                }
                return usuario;
            }).when(usuarioRepository).buscarPorEmailComBloqueio(eq(dados.email()));

            a = executor.submit(primeira);
            aguardarSinalDoWorker(primeiroBloqueou, a);
            b = executor.submit(segunda);
            aguardarSinalDoWorker(segundoEntrou, a, b);
            assertFalse(segundoBloqueou.await(300, TimeUnit.MILLISECONDS),
                    "A segunda operacao nao pode adquirir o bloqueio antes da liberacao.");
            if (b.isDone()) {
                b.get();
                fail("A segunda operacao nao pode terminar enquanto a primeira mantem o bloqueio.");
            }
            liberarPrimeiro.countDown();
            // get propaga tambem AssertionError e excecoes produzidas nos workers.
            a.get(30, TimeUnit.SECONDS);
            b.get(30, TimeUnit.SECONDS);
            assertEquals(0L, segundoBloqueou.getCount());
            assertEquals(2, chamadas.get(), "As duas operacoes devem consultar o repositorio real.");
        } catch (Exception | Error erro) {
            falhaPrincipal = erro;
            throw erro;
        } finally {
            liberarPrimeiro.countDown();
            try {
                executor.shutdownNow();
                workersEncerrados = false;
                workersEncerrados = executor.awaitTermination(30, TimeUnit.SECONDS);
                assertTrue(workersEncerrados,
                        "Workers devem encerrar antes da limpeza e remocao dos spies.");
                // Mesmo quando a sincronizacao falha, recuperar erros dos dois workers.
                for (Future<?> worker : new Future<?>[]{a, b}) {
                    if (worker != null && worker.isDone() && !worker.isCancelled()) {
                        try {
                            worker.get();
                        } catch (ExecutionException erroWorker) {
                            if (falhaPrincipal == null) {
                                throw erroWorker;
                            }
                            if (erroWorker != falhaPrincipal
                                    && erroWorker.getCause() != falhaPrincipal.getCause()) {
                                falhaPrincipal.addSuppressed(erroWorker);
                            }
                        }
                    }
                }
                reset(usuarioRepository);
            } catch (Exception | Error erroEncerramento) {
                if (falhaPrincipal == null) {
                    throw erroEncerramento;
                }
                falhaPrincipal.addSuppressed(erroEncerramento);
            }
        }
    }

    private static final class FalhaHomologacaoException extends RuntimeException {
        private FalhaHomologacaoException() {
            super("Falha controlada de homologacao apos flush.");
        }
    }

    /*
     * =====================================================
     * CONFIGURACAO ISOLADA DE HOMOLOGACAO
     *
     * Apenas duas entidades e dois repositorios.
     * SMTP simulado.
     * Sem inicializacao do servidor HTTP.
     * =====================================================
     */
    @SpringBootConfiguration
    @EnableAutoConfiguration
    @EntityScan(basePackageClasses = {
            Usuario.class,
            RecuperacaoSenha.class
    })
    @EnableJpaRepositories(
            basePackages = "br.com.rpmont.conferencia.repository",
            includeFilters = @ComponentScan.Filter(
                    type = FilterType.ASSIGNABLE_TYPE,
                    classes = {
                            UsuarioRepository.class,
                            RecuperacaoSenhaRepository.class
                    }
            )
    )
    @Import(RecuperacaoSenhaServiceImpl.class)
    static class ConfiguracaoHomologacao {

        @Bean
        PasswordEncoder passwordEncoder() {
            return new BCryptPasswordEncoder();
        }

        @Bean
        PersistenceManagedTypes persistenceManagedTypes() {
            return PersistenceManagedTypes.of(
                    Usuario.class.getName(),
                    RecuperacaoSenha.class.getName()
            );
        }
    }
}
