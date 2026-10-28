package br.com.rpmont.conferencia.exception;

import br.com.rpmont.conferencia.controller.AuthController;
import br.com.rpmont.conferencia.service.AuthService;
import br.com.rpmont.conferencia.service.RecuperacaoSenhaService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.parallel.Isolated;
import org.junit.jupiter.api.parallel.Execution;
import org.junit.jupiter.api.parallel.ExecutionMode;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.mail.MailSendException;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import org.slf4j.LoggerFactory;

import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(OutputCaptureExtension.class)
@Execution(ExecutionMode.SAME_THREAD)
@Isolated("Captura de saida MVC com servicos simulados e sem infraestrutura externa.")
class GlobalExceptionHandlerMvcTest {

    private static final String SENHA = "SENHA_FICTICIA_PRIVADA";
    private static final String TOKEN = "JWT_FICTICIO_PRIVADO";
    private static final String CODIGO = "739251";
    private static final String DETALHE = "SMTP_FICTICIO_CAUSA INFRA_FICTICIA_INTERNA " + SENHA + " " + TOKEN + " " + CODIGO;

    private AuthService authService;
    private RecuperacaoSenhaService recuperacaoService;
    private MockMvc mvc;
    private final Logger springLogger = (Logger) LoggerFactory.getLogger("org.springframework");
    private Level nivelSpringAnterior;

    @BeforeEach
    void configurarMvcIsolado() {
        // O alvo e o advice, nao o diagnostico DEBUG de corpos/DTOs do framework.
        // Mantem WARN/ERROR do Spring e todos os registros do handler sob verificacao.
        nivelSpringAnterior = springLogger.getLevel();
        springLogger.setLevel(Level.INFO);
        authService = mock(AuthService.class);
        recuperacaoService = mock(RecuperacaoSenhaService.class);
        // Controller real e advice real; sem SpringBootTest, perfis, filtros JWT, banco ou SMTP.
        mvc = MockMvcBuilders.standaloneSetup(new AuthController(authService, recuperacaoService),
                        new ParametrosController())
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @AfterEach
    void restaurarNivelDoFramework() {
        springLogger.setLevel(nivelSpringAnterior);
    }

    private static Stream<Arguments> corposInvalidos() {
        return Stream.of("/auth/login", "/auth/recuperar-senha/solicitar",
                        "/auth/recuperar-senha/validar", "/auth/recuperar-senha/redefinir")
                .flatMap(rota -> Stream.of("", "{\"senha\":\"" + SENHA + "\",\"codigo\":\"" + CODIGO + "\",")
                        .map(corpo -> Arguments.of(rota, corpo)));
    }

    @ParameterizedTest
    @MethodSource("corposInvalidos")
    void corpoAusenteOuJsonInvalidoDeveRetornar400(String rota, String corpo, CapturedOutput output) throws Exception {
        MvcResult resultado = mvc.perform(requisicao(rota).content(corpo))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("Corpo da requisição ausente ou inválido."))
                .andReturn();
        verifyNoInteractions(authService, recuperacaoService);
        verificarAusenciaDeDados(resultado, output);
    }

    @ParameterizedTest
    @ValueSource(strings = {"LOGIN", "SMTP"})
    void falhaInesperadaDeveRetornar500Generico(String origem, CapturedOutput output) throws Exception {
        String rota;
        String corpo;
        if (origem.equals("LOGIN")) {
            when(authService.login(any())).thenThrow(new IllegalStateException(DETALHE, new RuntimeException(DETALHE)));
            rota = "/auth/login";
            corpo = "{\"matricula\":\"USUARIO_FICTICIO\",\"senha\":\"" + SENHA + "\"}";
        } else {
            doThrow(new MailSendException(DETALHE, new RuntimeException(DETALHE)))
                    .when(recuperacaoService).solicitarRecuperacao(any());
            rota = "/auth/recuperar-senha/solicitar";
            corpo = "{\"email\":\"ficticio@example.invalid\"}";
        }
        MvcResult resultado = mvc.perform(requisicao(rota).content(corpo))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.status").value(500))
                .andExpect(jsonPath("$.message").value("Ocorreu um erro interno inesperado."))
                .andExpect(jsonPath("$.trace").doesNotExist())
                .andReturn();
        verificarAusenciaDeDados(resultado, output);
    }

    @ParameterizedTest
    @ValueSource(ints = {400, 401, 403, 429})
    void errosDeliberadosDevemPreservarStatusEMensagem(int codigoHttp, CapturedOutput output) throws Exception {
        String mensagem = "Mensagem publica deliberada.";
        String rota;
        String corpo;
        if (codigoHttp == 401 || codigoHttp == 403) {
            when(authService.login(any())).thenThrow(new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.valueOf(codigoHttp), mensagem));
            rota = "/auth/login";
            corpo = "{\"matricula\":\"USUARIO_FICTICIO\",\"senha\":\"" + SENHA + "\"}";
        } else {
            doThrow(new RecuperacaoSenhaRejeitadaException(HttpStatus.valueOf(codigoHttp), mensagem))
                    .when(recuperacaoService).validarCodigo(any());
            rota = "/auth/recuperar-senha/validar";
            corpo = "{\"email\":\"ficticio@example.invalid\",\"codigo\":\"" + CODIGO + "\"}";
        }
        MvcResult resultado = mvc.perform(requisicao(rota).content(corpo))
                .andExpect(status().is(codigoHttp))
                .andExpect(jsonPath("$.message").value(mensagem))
                .andReturn();
        verificarAusenciaDeDados(resultado, output);
    }

    @ParameterizedTest
    @ValueSource(strings = {"ARGUMENTO", "SEGURANCA", "STATUS_503"})
    void mensagensTecnicasDevemSerSubstituidasNoHttp(String tipo, CapturedOutput output) throws Exception {
        RuntimeException falha;
        int status;
        String mensagem;
        if (tipo.equals("ARGUMENTO")) {
            falha = new IllegalArgumentException(DETALHE);
            status = 400;
            mensagem = "Requisição inválida.";
        } else if (tipo.equals("SEGURANCA")) {
            falha = new SecurityException(DETALHE);
            status = 403;
            mensagem = "Acesso negado.";
        } else {
            falha = new org.springframework.web.server.ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, DETALHE);
            status = 503;
            mensagem = "Ocorreu um erro interno inesperado.";
        }
        when(authService.login(any())).thenThrow(falha);
        MvcResult resultado = mvc.perform(requisicao("/auth/login")
                        .content("{\"matricula\":\"USUARIO_FICTICIO\",\"senha\":\"" + SENHA + "\"}"))
                .andExpect(status().is(status))
                .andExpect(jsonPath("$.message").value(mensagem))
                .andReturn();
        verificarAusenciaDeDados(resultado, output);
    }

    @Test
    void validacaoDoLoginDevePreservarCamposSemExporEntrada(CapturedOutput output) throws Exception {
        MvcResult resultado = mvc.perform(requisicao("/auth/login")
                        .content("{\"matricula\":\"\",\"senha\":\"" + SENHA + "\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Existem campos inválidos na requisição."))
                .andExpect(jsonPath("$.fields.matricula").value("A matrícula é obrigatória."))
                .andReturn();
        verifyNoInteractions(authService, recuperacaoService);
        verificarAusenciaDeDados(resultado, output);
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "VALOR_FICTICIO_INVALIDO"})
    void parametroAusenteOuTipoInvalidoDeveRetornar400(String valor, CapturedOutput output) throws Exception {
        MockHttpServletRequestBuilder requisicao = get("/auditoria-parametros").accept(MediaType.APPLICATION_JSON);
        if (!valor.isEmpty()) {
            requisicao.param("quantidade", valor);
        }
        MvcResult resultado = mvc.perform(requisicao)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Parâmetro da requisição ausente ou inválido."))
                .andReturn();
        verificarAusenciaDeDados(resultado, output);
        assertFalse(resultado.getResponse().getContentAsString().contains("VALOR_FICTICIO_INVALIDO"));
        assertFalse(output.getAll().contains("VALOR_FICTICIO_INVALIDO"));
    }

    @Test
    void metodoInvalidoDeveRetornar405ComAllow(CapturedOutput output) throws Exception {
        MvcResult resultado = mvc.perform(get("/auth/login").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isMethodNotAllowed())
                .andExpect(header().string("Allow", "POST"))
                .andExpect(jsonPath("$.message").value("Método HTTP não permitido."))
                .andReturn();
        verificarAusenciaDeDados(resultado, output);
    }

    @Test
    void conteudoNaoSuportadoDeveRetornar415(CapturedOutput output) throws Exception {
        MvcResult resultado = mvc.perform(post("/auth/login").contentType(MediaType.TEXT_PLAIN)
                        .accept(MediaType.APPLICATION_JSON).content(DETALHE))
                .andExpect(status().isUnsupportedMediaType())
                .andExpect(jsonPath("$.message").value("Tipo de conteúdo não suportado."))
                .andReturn();
        verifyNoInteractions(authService, recuperacaoService);
        verificarAusenciaDeDados(resultado, output);
    }

    private MockHttpServletRequestBuilder requisicao(String rota) {
        return post(rota).contentType(MediaType.APPLICATION_JSON).accept(MediaType.APPLICATION_JSON)
                .header("Authorization", "Bearer " + TOKEN).queryParam("token", TOKEN);
    }

    private void verificarAusenciaDeDados(MvcResult resultado, CapturedOutput output) throws Exception {
        String corpo = resultado.getResponse().getContentAsString();
        for (String sentinela : new String[]{SENHA, TOKEN, CODIGO, "SMTP_FICTICIO_CAUSA", "INFRA_FICTICIA_INTERNA"}) {
            assertFalse(corpo.contains(sentinela), "A resposta HTTP nao deve expor dados sensiveis.");
            assertFalse(output.getAll().contains(sentinela), "A saida MVC nao deve expor dados sensiveis.");
        }
    }

    @RestController
    static class ParametrosController {
        @GetMapping("/auditoria-parametros")
        public String quantidade(@RequestParam("quantidade") Integer quantidade) {
            return quantidade.toString();
        }
    }
}
