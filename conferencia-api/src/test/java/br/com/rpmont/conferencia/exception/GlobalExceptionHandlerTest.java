package br.com.rpmont.conferencia.exception;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import jakarta.validation.Path;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.parallel.Isolated;
import org.junit.jupiter.api.parallel.Execution;
import org.junit.jupiter.api.parallel.ExecutionMode;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.slf4j.LoggerFactory;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.core.MethodParameter;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.MailSendException;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(OutputCaptureExtension.class)
@Execution(ExecutionMode.SAME_THREAD)
@Isolated("Captura e restaura o logger do handler sem interferir em outras classes.")
class GlobalExceptionHandlerTest {

    private static final List<String> SENTINELAS = List.of(
            "SENHA_FICTICIA_PRIVADA", "JWT_FICTICIO_PRIVADO", "739251",
            "SMTP_FICTICIO_CAUSA", "INFRA_FICTICIA_INTERNA", "HEADER_FICTICIO", "BODY_FICTICIO");
    private static final String DETALHE = String.join(" ", SENTINELAS);
    private static final String ERRO_INTERNO = "Ocorreu um erro interno inesperado.";

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();
    private final MockHttpServletRequest request = new MockHttpServletRequest("POST", "/auth/login");
    private final Logger logger = (Logger) LoggerFactory.getLogger(GlobalExceptionHandler.class);
    private ListAppender<ILoggingEvent> appender;
    private Level nivelAnterior;
    private boolean aditivoAnterior;

    @BeforeEach
    void capturarLogger() {
        request.setQueryString("token=" + SENTINELAS.get(1));
        request.addHeader("Authorization", "Bearer " + SENTINELAS.get(1));
        request.addHeader("X-Request-Id", SENTINELAS.get(5));
        request.setContent(DETALHE.getBytes(StandardCharsets.UTF_8));
        nivelAnterior = logger.getLevel();
        aditivoAnterior = logger.isAdditive();
        logger.setLevel(Level.ERROR);
        logger.setAdditive(false);
        appender = new ListAppender<>();
        appender.setContext(logger.getLoggerContext());
        appender.start();
        logger.addAppender(appender);
    }

    @AfterEach
    void restaurarLogger() {
        logger.detachAppender(appender);
        appender.stop();
        logger.setLevel(nivelAnterior);
        logger.setAdditive(aditivoAnterior);
    }

    @ParameterizedTest
    @ValueSource(booleans = {false, true})
    void falhaInesperadaNaoDeveExporMensagemOuCausas(boolean smtp, CapturedOutput output) {
        Exception causa = new IllegalStateException(DETALHE);
        Exception falha = smtp ? new MailSendException(DETALHE, causa) : new RuntimeException(DETALHE, causa);
        ResponseEntity<ApiError> resposta = handler.handleException(falha, request);
        verificarResposta(resposta, HttpStatus.INTERNAL_SERVER_ERROR, ERRO_INTERNO, output);
        verificarRegistroSeguro();
    }

    @ParameterizedTest
    @ValueSource(ints = {500, 502, 503, 504})
    void status5xxNaoDeveExporMotivo(int status, CapturedOutput output) {
        ResponseEntity<ApiError> resposta = handler.handleResponseStatusException(
                new ResponseStatusException(HttpStatus.valueOf(status), DETALHE, new RuntimeException(DETALHE)), request);
        verificarResposta(resposta, HttpStatus.valueOf(status), ERRO_INTERNO, output);
        verificarRegistroSeguro();
    }

    @Test
    void statusNaoMapeadoDeveUsar500Generico(CapturedOutput output) {
        ResponseEntity<ApiError> resposta = handler.handleResponseStatusException(
                new ResponseStatusException(599, DETALHE, new RuntimeException(DETALHE)), request);
        verificarResposta(resposta, HttpStatus.INTERNAL_SERVER_ERROR, ERRO_INTERNO, output);
        verificarRegistroSeguro();
    }

    @Test
    void argumentoInvalidoDeveUsarMensagemFixa(CapturedOutput output) {
        verificarResposta(handler.handleIllegalArgumentException(new IllegalArgumentException(DETALHE), request),
                HttpStatus.BAD_REQUEST, "Requisição inválida.", output);
        assertTrue(appender.list.isEmpty());
    }

    @Test
    void ocorrenciasDevemTerIdentificadoresDistintos(CapturedOutput output) {
        verificarResposta(handler.handleException(new RuntimeException(DETALHE), request),
                HttpStatus.INTERNAL_SERVER_ERROR, ERRO_INTERNO, output);
        verificarResposta(handler.handleException(new RuntimeException(DETALHE), request),
                HttpStatus.INTERNAL_SERVER_ERROR, ERRO_INTERNO, output);
        assertEquals(2, appender.list.size());
        Object primeiro = appender.list.get(0).getArgumentArray()[0];
        Object segundo = appender.list.get(1).getArgumentArray()[0];
        assertInstanceOf(UUID.class, primeiro);
        assertInstanceOf(UUID.class, segundo);
        assertNotEquals(primeiro, segundo);
    }

    @Test
    void segurancaDeveUsarMensagemFixa(CapturedOutput output) {
        verificarResposta(handler.handleSecurityException(new SecurityException(DETALHE), request),
                HttpStatus.FORBIDDEN, "Acesso negado.", output);
        assertTrue(appender.list.isEmpty());
    }

    @ParameterizedTest
    @ValueSource(ints = {400, 403, 404, 409})
    void excecoesDeDominioDevemPreservarContrato(int status, CapturedOutput output) {
        String mensagem = "Mensagem publica de dominio.";
        ResponseEntity<ApiError> resposta = switch (status) {
            case 400 -> handler.handleBusinessException(new BusinessException(mensagem), request);
            case 403 -> handler.handleForbiddenException(new ForbiddenException(mensagem), request);
            case 404 -> handler.handleResourceNotFoundException(new ResourceNotFoundException(mensagem), request);
            default -> handler.handleConflictException(new ConflictException(mensagem), request);
        };
        verificarResposta(resposta, HttpStatus.valueOf(status), mensagem, output);
        assertTrue(appender.list.isEmpty());
    }

    @ParameterizedTest
    @ValueSource(ints = {400, 401, 403, 404, 409, 429})
    void status4xxDeliberadoDeveSerPreservado(int status, CapturedOutput output) {
        String mensagem = "Mensagem publica de autenticacao ou recuperacao.";
        ResponseStatusException excecao = status == 400 || status == 429
                ? new RecuperacaoSenhaRejeitadaException(HttpStatus.valueOf(status), mensagem)
                : new ResponseStatusException(HttpStatus.valueOf(status), mensagem);
        verificarResposta(handler.handleResponseStatusException(excecao, request),
                HttpStatus.valueOf(status), mensagem, output);
        assertTrue(appender.list.isEmpty());
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {" "})
    void motivoAusenteDevePreservarMensagemPadrao(String motivo, CapturedOutput output) {
        verificarResposta(handler.handleResponseStatusException(
                        new ResponseStatusException(HttpStatus.BAD_REQUEST, motivo), request),
                HttpStatus.BAD_REQUEST, "Não foi possível concluir a operação.", output);
    }

    @Test
    void validacaoDeCampoNaoDeveRetornarValorRejeitado(CapturedOutput output) throws Exception {
        BeanPropertyBindingResult binding = new BeanPropertyBindingResult(new Object(), "request");
        binding.addError(new FieldError("request", "senha", DETALHE, false, null, null,
                "A senha é obrigatória."));
        MethodParameter parametro = new MethodParameter(
                getClass().getDeclaredMethod("endpointDeTeste", String.class), 0);
        ResponseEntity<ApiError> resposta = handler.handleMethodArgumentNotValidException(
                new MethodArgumentNotValidException(parametro, binding), request);
        verificarResposta(resposta, HttpStatus.BAD_REQUEST, "Existem campos inválidos na requisição.", output);
        assertEquals(Map.of("senha", "A senha é obrigatória."), resposta.getBody().fields());
    }

    @ParameterizedTest
    @ValueSource(strings = {"typeMismatch", "methodInvocation"})
    void bindingDeveSanitizarMensagemSemAlterarValidacaoDeliberada(String codigo, CapturedOutput output)
            throws Exception {
        BeanPropertyBindingResult binding = new BeanPropertyBindingResult(new Object(), "request");
        binding.addError(new FieldError("request", "materialId", DETALHE, true,
                new String[]{codigo}, null, "java.lang.String java.lang.Long " + DETALHE));
        binding.addError(new FieldError("request", "email", DETALHE, false,
                new String[]{"NotBlank"}, null, "O e-mail é obrigatório."));
        MethodParameter parametro = new MethodParameter(
                getClass().getDeclaredMethod("endpointDeTeste", String.class), 0);
        ResponseEntity<ApiError> resposta = handler.handleMethodArgumentNotValidException(
                new MethodArgumentNotValidException(parametro, binding), request);
        verificarResposta(resposta, HttpStatus.BAD_REQUEST, "Existem campos inválidos na requisição.", output);
        assertEquals(Map.of("materialId", "Valor inválido.", "email", "O e-mail é obrigatório."),
                resposta.getBody().fields());
        assertTrue(appender.list.isEmpty(), "Binding invalido nao deve registrar detalhes.");
    }

    @Test
    void validacaoDeParametroDevePreservarContrato(CapturedOutput output) {
        ConstraintViolation<?> violacao = mock(ConstraintViolation.class);
        Path caminho = mock(Path.class);
        when(caminho.toString()).thenReturn("codigo");
        when(violacao.getPropertyPath()).thenReturn(caminho);
        when(violacao.getMessage()).thenReturn("Código inválido.");
        ResponseEntity<ApiError> resposta = handler.handleConstraintViolationException(
                new ConstraintViolationException(Set.of(violacao)), request);
        verificarResposta(resposta, HttpStatus.BAD_REQUEST, "Existem parâmetros inválidos na requisição.", output);
        assertEquals(Map.of("codigo", "Código inválido."), resposta.getBody().fields());
    }

    @Test
    void integridadeNaoDeveRetornarDetalheTecnico(CapturedOutput output) {
        verificarResposta(handler.handleDataIntegrityViolationException(
                        new DataIntegrityViolationException(DETALHE, new RuntimeException(DETALHE)), request),
                HttpStatus.CONFLICT,
                "A operação não pôde ser concluída porque viola uma regra de integridade dos dados.", output);
    }

    @Test
    void acessoNegadoDevePreservarMensagemPublica(CapturedOutput output) {
        verificarResposta(handler.handleAccessDeniedException(new AccessDeniedException(DETALHE), request),
                HttpStatus.FORBIDDEN, "Você não possui permissão para realizar esta operação.", output);
    }

    private void endpointDeTeste(String valor) {
    }

    private void verificarRegistroSeguro() {
        assertEquals(1, appender.list.size());
        ILoggingEvent evento = appender.list.getFirst();
        assertEquals(Level.ERROR, evento.getLevel());
        assertEquals("categoria=FALHA_INTERNA ocorrencia={}", evento.getMessage());
        assertNull(evento.getThrowableProxy());
        assertEquals(1, evento.getArgumentArray().length);
        assertInstanceOf(UUID.class, evento.getArgumentArray()[0]);
        assertEquals(4, ((UUID) evento.getArgumentArray()[0]).version());
        assertTrue(evento.getFormattedMessage().matches(
                "categoria=FALHA_INTERNA ocorrencia=[0-9a-f-]{36}"));
    }

    private void verificarResposta(ResponseEntity<ApiError> resposta, HttpStatus status,
                                    String mensagem, CapturedOutput output) {
        assertEquals(status, resposta.getStatusCode());
        ApiError corpo = resposta.getBody();
        assertNotNull(corpo);
        assertEquals(status.value(), corpo.status());
        assertEquals(status.getReasonPhrase(), corpo.error());
        assertEquals(mensagem, corpo.message());
        assertEquals("/auth/login", corpo.path());
        assertNotNull(corpo.timestamp());
        String registros = output.getAll() + appender.list.stream()
                .map(ILoggingEvent::getFormattedMessage).reduce("", String::concat);
        for (String sentinela : SENTINELAS) {
            assertFalse(corpo.toString().contains(sentinela), "A resposta nao deve conter dados sensiveis.");
            assertFalse(registros.contains(sentinela), "Os registros nao devem conter dados sensiveis.");
        }
    }
}
