package br.com.rpmont.conferencia.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.parallel.Execution;
import org.junit.jupiter.api.parallel.ExecutionMode;
import org.junit.jupiter.api.parallel.Isolated;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(OutputCaptureExtension.class)
@Execution(ExecutionMode.SAME_THREAD)
@Isolated("Captura de stdout e stderr sem interferencia de outras classes.")
class EmailServiceImplTest {

    // Exclusivamente fixtures: nenhum arquivo de configuracao ou segredo real e carregado.
    private static final String SENHA_FICTICIA = "SEGREDO-FICTICIO-CAUDA9";
    private static final String LOGIN_FICTICIO = "smtp-ficticio@example.invalid";
    private static final String REMETENTE = "remetente-ficticio@example.invalid";
    private static final String DESTINATARIO = "destinatario-ficticio@example.invalid";
    private static final String CODIGO = "482791";

    private final JavaMailSender mailSender = mock(JavaMailSender.class);

    private ApplicationContextRunner contexto(String senhaFicticia) {
        // Sem @SpringBootTest, autoconfiguracao, banco, servidor ou carregamento de .properties.
        // A criacao real do bean executaria tambem um eventual @PostConstruct reintroduzido.
        return new ApplicationContextRunner()
                .withBean(JavaMailSender.class, () -> mailSender)
                .withBean(EmailServiceImpl.class)
                .withPropertyValues(
                        "app.mail.remetente=" + REMETENTE,
                        "spring.mail.username=" + LOGIN_FICTICIO,
                        "spring.mail.password=" + senhaFicticia);
    }

    @ParameterizedTest
    @ValueSource(strings = {SENHA_FICTICIA, "CAUDA9"})
    void inicializacaoNaoDeveExporCredenciais(String senhaFicticia, CapturedOutput output) {
        contexto(senhaFicticia).run(context -> {
            assertNull(context.getStartupFailure(), "O contexto minimo deve inicializar.");
            assertNotNull(context.getBean(EmailServiceImpl.class));
            verifyNoInteractions(mailSender);
        });
        verificarAusenciaDeDadosSensiveis(output, senhaFicticia);
    }

    @Test
    void devePreservarMensagemEEnviarSemExporDados(CapturedOutput output) {
        contexto(SENHA_FICTICIA).run(context -> {
            assertNull(context.getStartupFailure(), "O contexto minimo deve inicializar.");
            context.getBean(EmailServiceImpl.class)
                    .enviarCodigoRecuperacao("  " + DESTINATARIO + "  ", "  " + CODIGO + "  ");

            ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
            verify(mailSender).send(captor.capture());
            SimpleMailMessage mensagem = captor.getValue();
            assertEquals(REMETENTE, mensagem.getFrom());
            assertArrayEquals(new String[]{DESTINATARIO}, mensagem.getTo());
            assertEquals("Recuperação de senha - Sistema RPMont", mensagem.getSubject());
            assertNotNull(mensagem.getText());
            assertTrue(mensagem.getText().contains(CODIGO), "O corpo deve conter o codigo ficticio.");
            assertTrue(mensagem.getText().contains("10 minutos"), "A validade deve ser preservada.");
            assertFalse(mensagem.getText().contains(SENHA_FICTICIA));
            verifyNoMoreInteractions(mailSender);
        });
        verificarAusenciaDeDadosSensiveis(output, SENHA_FICTICIA);
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {" ", "\t"})
    void destinatarioInvalidoNaoDeveEnviarOuExporDados(String destinatario, CapturedOutput output) {
        contexto(SENHA_FICTICIA).run(context -> {
            assertNull(context.getStartupFailure(), "O contexto minimo deve inicializar.");
            EmailServiceImpl service = context.getBean(EmailServiceImpl.class);
            assertThrows(IllegalArgumentException.class,
                    () -> service.enviarCodigoRecuperacao(destinatario, CODIGO));
            verifyNoInteractions(mailSender);
        });
        verificarAusenciaDeDadosSensiveis(output, SENHA_FICTICIA);
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {" ", "12345", "1234567", "12A456"})
    void codigoInvalidoNaoDeveEnviarOuExporDados(String codigo, CapturedOutput output) {
        contexto(SENHA_FICTICIA).run(context -> {
            assertNull(context.getStartupFailure(), "O contexto minimo deve inicializar.");
            EmailServiceImpl service = context.getBean(EmailServiceImpl.class);
            assertThrows(IllegalArgumentException.class,
                    () -> service.enviarCodigoRecuperacao(DESTINATARIO, codigo));
            verifyNoInteractions(mailSender);
        });
        verificarAusenciaDeDadosSensiveis(output, SENHA_FICTICIA);
        if (codigo != null && !codigo.isBlank()) {
            assertFalse(output.getAll().contains(codigo), "A entrada invalida nao deve aparecer nos logs.");
        }
    }

    @Test
    void falhaSmtpDeveSerPropagadaSemRegistroPeloServico(CapturedOutput output) {
        // A mensagem propositalmente contem uma sentinela, para detectar impressao da excecao.
        MailSendException falha = new MailSendException("Falha SMTP simulada: " + SENHA_FICTICIA);
        doThrow(falha).when(mailSender).send(any(SimpleMailMessage.class));

        contexto(SENHA_FICTICIA).run(context -> {
            assertNull(context.getStartupFailure(), "O contexto minimo deve inicializar.");
            EmailServiceImpl service = context.getBean(EmailServiceImpl.class);
            MailSendException recebida = assertThrows(MailSendException.class,
                    () -> service.enviarCodigoRecuperacao(DESTINATARIO, CODIGO));
            assertSame(falha, recebida, "A falha deve manter a propagacao original.");
            verify(mailSender).send(any(SimpleMailMessage.class));
            verifyNoMoreInteractions(mailSender);
        });
        verificarAusenciaDeDadosSensiveis(output, SENHA_FICTICIA);
        assertFalse(output.getAll().contains("Falha SMTP simulada"),
                "O servico nao deve imprimir a excecao do transporte.");
    }

    private void verificarAusenciaDeDadosSensiveis(CapturedOutput output, String senhaFicticia) {
        String registros = output.getAll();
        String sufixo = senhaFicticia.substring(senhaFicticia.length() - 6);
        for (String dado : new String[]{senhaFicticia, sufixo, LOGIN_FICTICIO, REMETENTE,
                DESTINATARIO, CODIGO}) {
            // Evita incluir o conteudo capturado nas mensagens de falha do proprio teste.
            assertFalse(registros.contains(dado), "Dados sensiveis ficticios nao devem aparecer nos logs.");
        }
        assertFalse(registros.contains("Tamanho da chave SMTP"));
        assertFalse(registros.contains("Final da chave SMTP"));
    }
}
