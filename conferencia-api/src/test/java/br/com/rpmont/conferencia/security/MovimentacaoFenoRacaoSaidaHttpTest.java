package br.com.rpmont.conferencia.security;

import br.com.rpmont.conferencia.config.SecurityConfig;
import br.com.rpmont.conferencia.controller.MovimentacaoFenoRacaoController;
import br.com.rpmont.conferencia.exception.GlobalExceptionHandler;
import br.com.rpmont.conferencia.model.*;
import br.com.rpmont.conferencia.repository.*;
import br.com.rpmont.conferencia.service.*;
import br.com.rpmont.conferencia.enums.*;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.context.annotation.*;
import org.springframework.core.env.MapPropertySource;
import org.springframework.mock.web.MockServletContext;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.FilterChainProxy;
import org.springframework.test.web.servlet.*;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.support.AnnotationConfigWebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import org.springframework.http.MediaType;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Stream;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Cadeia, controller, servico e handler reais. Sem Boot, banco, SMTP ou arquivos de configuracao. */
class MovimentacaoFenoRacaoSaidaHttpTest {
    private static final String CHAVE = "chave-sintetica-exclusiva-achado05-01234567890123456789";
    private static final String ROTA = "/feno-racao/movimentacoes/saidas";
    private AnnotationConfigWebApplicationContext context;
    private MockMvc mvc;
    private JwtService jwt;
    private UsuarioRepository usuarios;
    private LoteFenoRacaoRepository lotes;
    private MovimentacaoFenoRacaoRepository movimentos;
    private NotificacaoFenoRacaoRepository notificacoes;
    private NotificacaoFenoRacaoService notificacaoService;
    private EntityManager em;
    private MovimentacaoFenoRacaoController controller;
    private Usuario usuario;
    private LoteFenoRacao lote;

    @Configuration(proxyBeanMethods = false) @EnableWebMvc @EnableWebSecurity
    @Import({SecurityConfig.class, JwtService.class, JwtAuthenticationFilter.class,
            MovimentacaoFenoRacaoServiceImpl.class, GlobalExceptionHandler.class})
    static class Configuracao {
        @Bean UsuarioRepository usuarios() { return mock(UsuarioRepository.class); }
        @Bean LoteFenoRacaoRepository lotes() { return mock(LoteFenoRacaoRepository.class); }
        @Bean MovimentacaoFenoRacaoRepository movimentos() { return mock(MovimentacaoFenoRacaoRepository.class); }
        @Bean NotificacaoFenoRacaoRepository notificacoes() { return mock(NotificacaoFenoRacaoRepository.class); }
        @Bean NotificacaoFenoRacaoService notificacaoService() { return mock(NotificacaoFenoRacaoService.class); }
        @Bean EntityManager em() { return mock(EntityManager.class); }
        @Bean MovimentacaoFenoRacaoController controller(MovimentacaoFenoRacaoService service) {
            return spy(new MovimentacaoFenoRacaoController(service));
        }
    }
    @BeforeEach void preparar() {
        SecurityContextHolder.clearContext();
        context = new AnnotationConfigWebApplicationContext(); context.setServletContext(new MockServletContext());
        context.getEnvironment().getPropertySources().addFirst(new MapPropertySource("jwt-sintetico",
                Map.of("jwt.secret", CHAVE, "jwt.expiration", "3600000")));
        context.register(Configuracao.class); context.refresh();
        mvc = MockMvcBuilders.webAppContextSetup(context).addFilters(context.getBean(FilterChainProxy.class)).build();
        jwt = context.getBean(JwtService.class); usuarios = context.getBean(UsuarioRepository.class);
        lotes = context.getBean(LoteFenoRacaoRepository.class); movimentos = context.getBean(MovimentacaoFenoRacaoRepository.class);
        notificacoes = context.getBean(NotificacaoFenoRacaoRepository.class);
        notificacaoService = context.getBean(NotificacaoFenoRacaoService.class); em = context.getBean(EntityManager.class);
        controller = context.getBean(MovimentacaoFenoRacaoController.class);
        clearInvocations(controller);
        assertTrue(context.getBeansOfType(javax.sql.DataSource.class).isEmpty());
        assertTrue(context.getBeansOfType(jakarta.persistence.EntityManagerFactory.class).isEmpty());
        assertTrue(context.getBeansOfType(org.springframework.mail.javamail.JavaMailSender.class).isEmpty());
        usuario = new Usuario(); usuario.setId(7L); usuario.setMatricula("SAIDA05-SINTETICA");
        usuario.setNome("Nome sintetico privado"); usuario.setSenha("HASH-SINTETICO-PRIVADO");
        usuario.setNivel(3); usuario.setSetor("Baia"); usuario.setUnidade("RPMont");
        usuario.setAtivo(true); usuario.setStatusAcesso("LIBERADO");
        when(usuarios.findByMatricula(usuario.getMatricula())).thenReturn(Optional.of(usuario));
        ProdutoFenoRacao produto = new ProdutoFenoRacao(); produto.setId(1);
        produto.setTipoProduto(TipoProdutoFenoRacao.FENO); produto.setNomeProduto("Produto sintetico");
        produto.setUnidadeControle(UnidadeControleFenoRacao.FARDO); produto.setPesoUnidadeKg(new BigDecimal("20.00"));
        lote = new LoteFenoRacao(); lote.setId(11); lote.setProduto(produto); lote.setCodigoLote("LOTE-PRIVADO-SINTETICO");
        lote.setUnidade("RPMont"); lote.setSituacao(SituacaoLoteFenoRacao.ATIVO);
        lote.setQuantidadeAtual(10); lote.setPesoTotalAtualKg(new BigDecimal("200.00"));
    }
    @AfterEach void limpar() {
        if (context != null) context.close(); SecurityContextHolder.clearContext();
    }
    private String body(String quantidade) {
        return "{\"loteId\":11,\"quantidadeNecessariaKg\":" + quantidade
                + ",\"dataSaida\":\"" + LocalDate.now() + "\",\"servico\":\"Servico sintetico\","
                + "\"responsavel\":\"Responsavel sintetico\"}";
    }
    private void prepararGravacao() {
        when(lotes.findByIdAndUnidade(11, usuario.getUnidade().trim())).thenReturn(Optional.of(lote));
        when(movimentos.saveAndFlush(any())).thenAnswer(i -> {
            MovimentacaoFenoRacao m = i.getArgument(0); m.setId(31L); return m;
        });
    }
    private List<Object> estadoLote() {
        return Arrays.asList(lote.getQuantidadeAtual(), lote.getPesoTotalAtualKg(), lote.getSituacao(),
                lote.getUsuarioModificadorId(), lote.getDataModificacao());
    }
    private void semVazamento(MvcResult result, String token) throws Exception {
        String resposta = result.getResponse().getContentAsString()
                + String.valueOf(result.getResponse().getErrorMessage())
                + result.getResponse().getHeaderNames().stream()
                .map(nome -> result.getResponse().getHeaders(nome).toString()).reduce("", String::concat);
        for (String privado : List.of(token, CHAVE, usuario.getSenha(), usuario.getNome(), lote.getCodigoLote(),
                "java.lang.", "org.hibernate", "jdbc:mysql:", "stackTrace")) {
            assertFalse(resposta.contains(privado), "Resposta de negativa nao deve expor dados protegidos.");
        }
    }
    static Stream<Arguments> autorizados() {
        return Stream.of("RPMont", "3º EPMont").flatMap(unidade ->
                Stream.of(TipoProdutoFenoRacao.FENO, TipoProdutoFenoRacao.RACAO_ADULTO_PREMIUM).flatMap(tipo ->
                        Stream.of(Arguments.of(1, null, unidade, tipo), Arguments.of(2, "Comando", unidade, tipo),
                                Arguments.of(3, "Baia", unidade, tipo), Arguments.of(3, "Baias", unidade, tipo),
                                Arguments.of(3, "Fiscal-de-dia", unidade, tipo))));
    }
    @ParameterizedTest @MethodSource("autorizados")
    void endpointRealAutorizaENaoDependeDaRestricaoDaTela(int nivel, String setor, String unidade, TipoProdutoFenoRacao tipo) throws Exception {
        usuario.setNivel(nivel); usuario.setSetor(setor); usuario.setUnidade(unidade);
        lote.setUnidade(unidade); lote.getProduto().setTipoProduto(tipo); prepararGravacao();
        mvc.perform(post(ROTA).header("Authorization", "Bearer " + jwt.gerarToken(usuario))
                        .contentType(MediaType.APPLICATION_JSON).content(body("21")))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.id").value(31))
                .andExpect(jsonPath("$.tipoProduto").value(tipo.name()))
                .andExpect(jsonPath("$.quantidadeUnidades").value(2))
                .andExpect(jsonPath("$.saldoAnterior").value(10)).andExpect(jsonPath("$.saldoPosterior").value(8))
                .andExpect(jsonPath("$.sobraCalculadaKg").value(19))
                .andExpect(jsonPath("$.unidadeOrigem").value(unidade));
        assertEquals(8, lote.getQuantidadeAtual());
        verify(lotes).findByIdAndUnidade(11, unidade); verify(lotes, never()).findById(any());
        verify(lotes).save(same(lote)); verify(movimentos).saveAndFlush(any()); verify(em).refresh(any());
        verifyNoInteractions(notificacoes, notificacaoService);
    }
    static Stream<Arguments> unidadesNaoAutorizadas() {
        return Stream.of(1, 2, 3).flatMap(nivel -> Stream.of("RPMºONT", "RPMONTº", "3ºº EPMont",
                "OUTRA", "RPMONT-OUTRA", "13º EPMont", "3 EPMont", "3-EPMont", "3_EPMont",
                "R PMont", "R-P-MONT")
                .map(unidade -> Arguments.of(nivel, unidade)));
    }
    @ParameterizedTest @MethodSource("unidadesNaoAutorizadas")
    void unidadesMalformadasRecebem403SemConsultarLoteOuGravar(int nivel, String unidade) throws Exception {
        usuario.setNivel(nivel); usuario.setUnidade(unidade);
        String token = jwt.gerarToken(usuario); var antes = estadoLote();
        var result = mvc.perform(post(ROTA).header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(body("20")))
                .andExpect(status().isForbidden()).andExpect(jsonPath("$.status").value(403)).andReturn();
        semVazamento(result, token); assertEquals(antes, estadoLote());
        verifyNoInteractions(lotes, movimentos, em, notificacoes, notificacaoService);
        verify(controller).registrarSaida(any(), any());
    }
    @ParameterizedTest @ValueSource(strings = {" rpmont ", "3EPMont", " 3º   epmont ", "RPMónt"})
    void aliasesComprovadosEVariacoesDeApresentacaoContinuam201(String unidade) throws Exception {
        usuario.setUnidade(unidade); lote.setUnidade(unidade.trim()); prepararGravacao();
        mvc.perform(post(ROTA).header("Authorization", "Bearer " + jwt.gerarToken(usuario))
                        .contentType(MediaType.APPLICATION_JSON).content(body("20")))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.saldoPosterior").value(9));
        verify(lotes).findByIdAndUnidade(11, unidade.trim());
        verify(lotes, never()).findById(any());
    }
    static Stream<Arguments> negados() {
        return Stream.of(Arguments.of(3, "P4", "RPMont"), Arguments.of(3, "Comando", "RPMont"),
                Arguments.of(3, null, "RPMont"), Arguments.of(3, " ", "RPMont"),
                Arguments.of(3, "Baias auxiliar", "RPMont"), Arguments.of(3, "Fiscal-de-dia P4", "RPMont"),
                Arguments.of(null, "Baia", "RPMont"), Arguments.of(0, "Baia", "RPMont"),
                Arguments.of(4, "Baia", "RPMont"), Arguments.of(1, null, "OUTRA"),
                Arguments.of(2, "Baia", "OUTRA"), Arguments.of(3, "Baias", "OUTRA"),
                Arguments.of(3, "Baia", null), Arguments.of(3, "Baia", " "));
    }
    @ParameterizedTest @MethodSource("negados")
    void jwtValidoSemAutorizacaoRecebe403AntesDoLote(Integer nivel, String setor, String unidade) throws Exception {
        usuario.setNivel(nivel); usuario.setSetor(setor); usuario.setUnidade(unidade);
        String token = jwt.gerarToken(usuario); var antes = estadoLote();
        var result = mvc.perform(post(ROTA).header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(body("21")))
                .andExpect(status().isForbidden()).andExpect(jsonPath("$.status").value(403)).andReturn();
        semVazamento(result, token); assertEquals(antes, estadoLote());
        verifyNoInteractions(lotes, movimentos, em, notificacoes, notificacaoService);
        verify(controller).registrarSaida(any(), any());
    }
    @ParameterizedTest @ValueSource(strings = {"INATIVO", "BLOQUEADO", "PENDENTE", "REMOVIDO", "REVOGADO"})
    void mesmoJwtPassaAPerderAcessoPelaCadeiaAntesDoController(String estado) throws Exception {
        prepararGravacao(); String token = jwt.gerarToken(usuario);
        mvc.perform(post(ROTA).header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON)
                .content(body("20"))).andExpect(status().isCreated());
        clearInvocations(controller, lotes, movimentos, em, notificacoes, notificacaoService);
        if (estado.equals("INATIVO")) usuario.setAtivo(false);
        else if (estado.equals("REMOVIDO")) when(usuarios.findByMatricula(usuario.getMatricula())).thenReturn(Optional.empty());
        else if (estado.equals("REVOGADO")) usuario.trocarSenha("NOVO-HASH-SINTETICO");
        else usuario.setStatusAcesso(estado);
        var antes = estadoLote();
        var result = mvc.perform(post(ROTA).header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON)
                .content(body("20"))).andExpect(status().isForbidden()).andReturn();
        assertNull(result.getHandler()); semVazamento(result, token); assertEquals(antes, estadoLote());
        verifyNoInteractions(controller, lotes, movimentos, em, notificacoes, notificacaoService);
    }
    @ParameterizedTest @ValueSource(strings = {"P4", "UNIDADE_NAO_EQUINA"})
    void mesmoJwtNaoCongelaPermissaoDeSetorOuUnidade(String mudanca) throws Exception {
        prepararGravacao(); String token = jwt.gerarToken(usuario);
        mvc.perform(post(ROTA).header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON)
                .content(body("20"))).andExpect(status().isCreated());
        clearInvocations(lotes, movimentos, em, notificacoes, notificacaoService);
        if (mudanca.equals("P4")) usuario.setSetor("P4"); else usuario.setUnidade("OUTRA");
        var antes = estadoLote();
        var result = mvc.perform(post(ROTA).header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON)
                .content(body("20"))).andExpect(status().isForbidden()).andReturn();
        semVazamento(result, token); assertEquals(antes, estadoLote());
        verifyNoInteractions(lotes, movimentos, em, notificacoes, notificacaoService);
    }
    @ParameterizedTest @ValueSource(ints = {1, 2, 3})
    void loteExternoNaoPodeSerRetiradoNemPorMaster(int nivel) throws Exception {
        usuario.setNivel(nivel); lote.setUnidade("3º EPMont");
        when(lotes.findByIdAndUnidade(11, "RPMont")).thenReturn(Optional.empty());
        var antes = estadoLote(); String token = jwt.gerarToken(usuario);
        var result = mvc.perform(post(ROTA).header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON)
                .content(body("20"))).andExpect(status().isNotFound()).andReturn();
        semVazamento(result, token); verify(lotes).findByIdAndUnidade(11, "RPMont");
        verify(lotes, never()).findById(any()); verify(lotes, never()).save(any());
        verifyNoInteractions(movimentos, em, notificacoes, notificacaoService); assertEquals(antes, estadoLote());
    }
    @ParameterizedTest @ValueSource(strings = {"{}", "QUANTIDADE_ZERO", "SEM_RESPONSAVEL"})
    void validacaoDeEntradaContinua400SemAcessarLote(String tipo) throws Exception {
        String corpo = tipo.equals("{}") ? "{}" : tipo.equals("QUANTIDADE_ZERO") ? body("0")
                : body("20").replace("Responsavel sintetico", "");
        mvc.perform(post(ROTA).header("Authorization", "Bearer " + jwt.gerarToken(usuario)).contentType(MediaType.APPLICATION_JSON)
                .content(corpo)).andExpect(status().isBadRequest());
        verifyNoInteractions(lotes, movimentos, em, notificacoes, notificacaoService);
    }
    @Test void saldoInsuficienteContinua409SemAlterarEstoque() throws Exception {
        prepararGravacao(); var antes = estadoLote();
        mvc.perform(post(ROTA).header("Authorization", "Bearer " + jwt.gerarToken(usuario)).contentType(MediaType.APPLICATION_JSON)
                .content(body("201"))).andExpect(status().isConflict());
        assertEquals(antes, estadoLote()); verify(lotes, never()).save(any()); verifyNoInteractions(movimentos, em);
    }
    @ParameterizedTest @ValueSource(strings = {"AUSENTE", "INVALIDO"})
    void semJwtValidoNaoExecutaController(String tipo) throws Exception {
        var request = post(ROTA).contentType(MediaType.APPLICATION_JSON).content(body("20"));
        if (tipo.equals("INVALIDO")) request.header("Authorization", "Bearer JWT_INVALIDO_SINTETICO");
        var result = mvc.perform(request).andExpect(status().isForbidden()).andReturn();
        assertNull(result.getHandler()); verifyNoInteractions(controller, usuarios, lotes, movimentos, em, notificacoes, notificacaoService);
    }
}
