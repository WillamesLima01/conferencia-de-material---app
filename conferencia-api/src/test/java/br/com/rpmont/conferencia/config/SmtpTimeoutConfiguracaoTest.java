package br.com.rpmont.conferencia.config;

import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.parallel.Execution;
import org.junit.jupiter.api.parallel.ExecutionMode;
import org.junit.jupiter.api.parallel.Isolated;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.mail.autoconfigure.MailSenderAutoConfiguration;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.core.env.Profiles;
import org.springframework.core.env.StandardEnvironment;
import org.springframework.core.env.SystemEnvironmentPropertySource;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.support.ResourcePropertySource;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.io.IOException;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(OutputCaptureExtension.class)
@Execution(ExecutionMode.SAME_THREAD)
@Isolated("Captura de saida dos testes de configuracao SMTP.")
class SmtpTimeoutConfiguracaoTest {

    private static final String LOGIN_FICTICIO = "smtp-ficticio@example.invalid";
    private static final String SENHA_FICTICIA = "SEGREDO-FICTICIO-CAUDA9";

    private ApplicationContextRunner contexto(String protocolo, Map<String, Object> ambienteFicticio) {
        // Carrega apenas o recurso explicito, sem ConfigData, arquivos externos ou perfis locais.
        // Remove fontes reais do processo para que o resultado nao dependa da maquina.
        return new ApplicationContextRunner()
                .withInitializer(context -> {
                    var environment = context.getEnvironment();
                    var fontes = environment.getPropertySources();
                    fontes.remove(StandardEnvironment.SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME);
                    fontes.remove(StandardEnvironment.SYSTEM_PROPERTIES_PROPERTY_SOURCE_NAME);
                    fontes.addFirst(new SystemEnvironmentPropertySource("ambiente-smtp-ficticio", ambienteFicticio));
                    try {
                        fontes.addLast(new ResourcePropertySource("configuracao-versionada",
                                new ClassPathResource("application.properties")));
                    } catch (IOException erro) {
                        throw new IllegalStateException("Falha ao carregar configuracao versionada.", erro);
                    }
                    environment.setActiveProfiles("teste-smtp-timeouts");
                })
                .withConfiguration(AutoConfigurations.of(MailSenderAutoConfiguration.class))
                .withPropertyValues(
                        "spring.profiles.active=teste-smtp-timeouts",
                        "spring.profiles.include=",
                        "spring.mail.host=127.0.0.1",
                        "spring.mail.port=2525",
                        "spring.mail.protocol=" + protocolo,
                        "spring.mail.username=" + LOGIN_FICTICIO,
                        "spring.mail.password=" + SENHA_FICTICIA,
                        "spring.mail.test-connection=false",
                        "spring.mail.properties[mail.debug]=false");
    }

    @ParameterizedTest
    @ValueSource(strings = {"smtp", "smtps"})
    void deveAplicarCincoSegundosPorPadrao(String protocolo, CapturedOutput output) {
        verificarConfiguracao(protocolo, Map.of(), "5000", "5000", "5000");
        verificarSaidaSemCredenciais(output);
    }

    @ParameterizedTest
    @ValueSource(strings = {"smtp", "smtps"})
    void deveAplicarVariaveisDeAmbienteFicticias(String protocolo, CapturedOutput output) {
        verificarConfiguracao(protocolo, Map.of(
                "RPMONT_SMTP_CONNECTION_TIMEOUT_MS", "1100",
                "RPMONT_SMTP_READ_TIMEOUT_MS", "2200",
                "RPMONT_SMTP_WRITE_TIMEOUT_MS", "3300"), "1100", "2200", "3300");
        verificarSaidaSemCredenciais(output);
    }

    private void verificarConfiguracao(String protocolo, Map<String, Object> ambienteFicticio,
                                       String conexao, String leitura, String escrita) {
        contexto(protocolo, ambienteFicticio).run(context -> {
            assertNull(context.getStartupFailure(), "A autoconfiguracao isolada deve inicializar.");
            assertFalse(context.getEnvironment().acceptsProfiles(Profiles.of("local")));
            assertArrayEquals(new String[]{"teste-smtp-timeouts"}, context.getEnvironment().getActiveProfiles());
            assertEquals("teste-smtp-timeouts", context.getEnvironment().getProperty("spring.profiles.active"));
            assertEquals(1, context.getBeansOfType(JavaMailSenderImpl.class).size());
            JavaMailSenderImpl sender = context.getBean(JavaMailSenderImpl.class);
            assertEquals(protocolo, sender.getProtocol());
            assertEquals("127.0.0.1", sender.getHost());

            // getSession apenas cria a Session em memoria; nao chama connect ou send.
            for (String transporte : new String[]{"smtp", "smtps"}) {
                for (String[] item : new String[][]{
                        {"connectiontimeout", conexao}, {"timeout", leitura}, {"writetimeout", escrita}}) {
                    String chave = "mail." + transporte + "." + item[0];
                    assertEquals(item[1], sender.getJavaMailProperties().getProperty(chave));
                    assertEquals(item[1], sender.getSession().getProperty(chave));
                }
            }
            assertFalse(sender.getSession().getDebug());
        });
    }

    private void verificarSaidaSemCredenciais(CapturedOutput output) {
        for (String sentinela : new String[]{LOGIN_FICTICIO, SENHA_FICTICIA, "CAUDA9"}) {
            assertFalse(output.getAll().contains(sentinela), "Credenciais ficticias nao devem aparecer na saida.");
        }
    }
}
