package br.com.rpmont.conferencia.security;

import br.com.rpmont.conferencia.support.PatrimonioHomologacaoFixture;
import br.com.rpmont.conferencia.model.Usuario;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.parallel.Execution;
import org.junit.jupiter.api.parallel.ExecutionMode;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import br.com.rpmont.conferencia.enums.SituacaoMaterial;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.security.web.FilterChainProxy;
import org.springframework.test.web.servlet.*;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import java.nio.charset.StandardCharsets;
import java.util.*;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.core.env.Environment;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(classes = PatrimonioHomologacaoFixture.Configuracao.class,
        webEnvironment = SpringBootTest.WebEnvironment.MOCK, properties = {
        "spring.config.location=classpath:/application-homolog.properties",
        "spring.profiles.include=", "spring.datasource.url=" + PatrimonioHomologacaoFixture.URL,
        "spring.jpa.hibernate.ddl-auto=validate", "spring.main.web-application-type=servlet",
        "spring.jpa.show-sql=false", "logging.level.org.hibernate.SQL=OFF",
        "logging.level.org.hibernate.orm.jdbc.bind=OFF", "logging.level.org.springframework.web=INFO"})
@ContextConfiguration(initializers = PatrimonioHomologacaoFixture.DestinoLocal.class)
@ActiveProfiles("homolog")
@Execution(ExecutionMode.SAME_THREAD)
class PatrimonioHttpSegurancaIntegracaoTest extends PatrimonioHomologacaoFixture {
    @Autowired private WebApplicationContext context;
    @Autowired private FilterChainProxy filtros;
    @Autowired private Environment environment;
    private MockMvc mvc;
    private static final String ROTA = "/movimentacao-material";

    @BeforeEach void prepararMvc() {
        mvc = MockMvcBuilders.webAppContextSetup(context).addFilters(filtros).build();
    }
    private ResultActions consultar(String rota, String token) throws Exception {
        var request = get(rota);
        if (token != null) request.header("Authorization", "Bearer " + token);
        return mvc.perform(request);
    }
    private String token(Usuario usuario) { return jwt.gerarToken(usuario); }
    private void semVazamento(MvcResult resultado, String token) throws Exception {
        String corpo = resultado.getResponse().getContentAsString(StandardCharsets.UTF_8);
        for (String proibido : List.of(materialB.getNumeroSerie(), autor.getSenha(), "jdbc:mysql:",
                "org.hibernate", "java.lang.", "stackTrace", "RPMONT_HOMOLOG_DB_PASSWORD")) {
            assertFalse(corpo.contains(proibido), "Resposta de erro contem informacao protegida.");
        }
        if (token != null) assertFalse(corpo.contains(token), "Resposta nao deve reproduzir JWT.");
    }

    @ParameterizedTest
    @CsvSource({"2,P4", "3,P4", "2,COMANDO", "2,SUB-COMANDO", "2,SUBCOMANDO"})
    void perfisAutorizadosLeemSemModificar(int nivel, String setor) throws Exception {
        var usuario = usuario(nivel, setor, unidadeA);
        String token = token(usuario);
        var antes = snapshot();
        consultar(ROTA, token).andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].id").value(movimentoA2))
                .andExpect(jsonPath("$[1].id").value(movimentoA1));
        consultar(ROTA + "/material/" + materialA.getId(), token).andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
        assertTrue(antes.equals(snapshot()), "GET nao pode modificar patrimonio.");
    }

    @ParameterizedTest
    @CsvSource({"3,COMANDO", "3,SUB-COMANDO", "3,SUBCOMANDO", "2,FISCAL-DE-DIA", "4,P4", "2,P4 AUXILIAR"})
    void perfilNaoAutorizadoRecebe403(int nivel, String setor) throws Exception {
        String token = token(usuario(nivel, setor, unidadeA));
        var resultado = consultar(ROTA, token).andExpect(status().isForbidden()).andReturn();
        semVazamento(resultado, token);
    }

    @Test void unidadeAusenteRecebe403() throws Exception {
        String token = token(usuario(2, "P4", null));
        semVazamento(consultar(ROTA, token).andExpect(status().isForbidden()).andReturn(), token);
    }

    @Test void externoEInexistenteTemMesmo404Publico() throws Exception {
        String token = token(usuario(2, "COMANDO", unidadeA));
        for (Long id : List.of(materialB.getId(), -1L)) {
            var resultado = consultar(ROTA + "/material/" + id, token).andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.status").value(404))
                    .andExpect(jsonPath("$.message").value("Material patrimonial não encontrado."))
                    .andReturn();
            semVazamento(resultado, token);
        }
    }

    @ParameterizedTest
    @ValueSource(ints = {0, 1, 2, 3})
    void filtrosNaoAmpliamAcesso(int caso) throws Exception {
        String token = token(usuario(2, "SUB-COMANDO", unidadeA));
        var filtro = switch (caso) {
            case 0 -> Map.of("unidade", unidadeB);
            case 1 -> Map.of("materialId", materialB.getId().toString());
            case 2 -> Map.of("numeroSerie", materialB.getNumeroSerie());
            case 3 -> Map.of("unidade", unidadeB, "materialId", materialB.getId().toString(),
                    "numeroSerie", materialB.getNumeroSerie());
            default -> throw new IllegalArgumentException("Caso de teste desconhecido.");
        };
        var request = get(ROTA).header("Authorization", "Bearer " + token);
        filtro.forEach(request::param);
        var resposta = mvc.perform(request).andExpect(status().isOk());
        if (caso == 0) {
            resposta.andExpect(jsonPath("$.length()").value(2))
                    .andExpect(jsonPath("$[0].id").value(movimentoA2))
                    .andExpect(jsonPath("$[1].id").value(movimentoA1))
                    .andExpect(jsonPath("$[0].materialId").value(materialA.getId()))
                    .andExpect(jsonPath("$[1].materialId").value(materialA.getId()));
        } else {
            resposta.andExpect(content().json("[]"));
        }
    }

    @Test void adminMasterConsultaGlobalEFiltra() throws Exception {
        String token = token(autor);
        String unidadeC = "TESTE-C-" + marca;
        var materialC = material(unidadeC, SituacaoMaterial.ATIVO);
        Long movimentoC = movimento(materialC, 4, unidadeC, unidadeC);
        // O documento exclusivo delimita os dados sinteticos sem supor banco vazio.
        mvc.perform(get(ROTA).header("Authorization", "Bearer " + token).param("numeroDocumento", marca))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(4))
                .andExpect(jsonPath("$[0].id").value(movimentoB))
                .andExpect(jsonPath("$[1].id").value(movimentoA2))
                .andExpect(jsonPath("$[2].id").value(movimentoA1))
                .andExpect(jsonPath("$[3].id").value(movimentoC));
        mvc.perform(get(ROTA).header("Authorization", "Bearer " + token)
                        .param("numeroDocumento", marca).param("unidade", unidadeB))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(3))
                .andExpect(jsonPath("$[0].id").value(movimentoB))
                .andExpect(jsonPath("$[1].id").value(movimentoA2))
                .andExpect(jsonPath("$[2].id").value(movimentoA1));
        consultar(ROTA + "/material/" + materialB.getId(), token).andExpect(status().isOk());
    }

    @ParameterizedTest
    @CsvSource({"1,INATIVO", "1,BLOQUEADO", "2,INATIVO", "2,BLOQUEADO", "2,PENDENTE"})
    void bloqueioPosteriorAoJwtImpedeAcesso(int nivel, String estado) throws Exception {
        var usuario = usuario(nivel, "P4", unidadeA);
        String token = token(usuario);
        alterarUsuario(usuario, u -> { if (estado.equals("INATIVO")) u.setAtivo(false); else u.setStatusAcesso(estado); });
        semVazamento(consultar(ROTA, token).andExpect(status().isForbidden()).andReturn(), token);
        semVazamento(consultar(ROTA + "/material/" + materialA.getId(), token)
                .andExpect(status().isForbidden()).andReturn(), token);
    }

    @Test void unidadeAtualDoCadastroPrevaleceSobreClaimAntiga() throws Exception {
        var usuario = usuario(2, "P4", unidadeA);
        String token = token(usuario);
        alterarUsuario(usuario, u -> u.setUnidade(unidadeB));
        consultar(ROTA, token).andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(movimentoB));
        consultar(ROTA + "/material/" + materialA.getId(), token).andExpect(status().isNotFound());
    }

    @Test void semTokenInvalidoEExpiradoSaoNegadosPelosFiltros() throws Exception {
        var usuario = usuario(2, "P4", unidadeA);
        String expirado = Jwts.builder().subject(usuario.getMatricula())
                .issuedAt(new Date(0)).expiration(new Date(1000))
                .signWith(Keys.hmacShaKeyFor(environment.getRequiredProperty("jwt.secret").getBytes(StandardCharsets.UTF_8)))
                .compact();
        // SecurityConfig nao configura entry point 401: a negacao atual e 403.
        for (String token : Arrays.asList(null, "jwt-ficticio-invalido", expirado)) {
            var resultado = consultar(ROTA, token).andExpect(status().isForbidden()).andReturn();
            semVazamento(resultado, token);
            assertNull(resultado.getHandler(), "Requisicao nao autenticada nao deve chegar ao controller.");
        }
    }

    @Test void parametroInvalidoRecebe400Sanitizado() throws Exception {
        String token = token(usuario(2, "P4", unidadeA));
        var resultado = mvc.perform(get(ROTA).header("Authorization", "Bearer " + token)
                        .param("materialId", "VALOR-REJEITADO-SENTINELA"))
                .andExpect(status().isBadRequest()).andReturn();
        String corpo = resultado.getResponse().getContentAsString(StandardCharsets.UTF_8);
        // Apenas categorias fixas e booleanos: nunca imprimir corpo, JWT ou valores do ambiente.
        var marcadores = Map.of("JAVA_LANG", "java.lang.", "TIPO_STRING", "java.lang.String",
                "TIPO_LONG", "java.lang.Long", "VALOR_REJEITADO", "VALOR-REJEITADO-SENTINELA");
        marcadores.forEach((categoria, marcador) -> System.out.println(
                "DIAGNOSTICO_HTTP400 categoria=" + categoria + " presente=" + corpo.contains(marcador)));
        assertAll("Resposta HTTP 400 sem detalhes internos ou valor rejeitado",
                () -> jsonPath("$.fields.materialId").value("Valor inválido.").match(resultado),
                () -> semVazamento(resultado, token),
                () -> assertFalse(corpo.contains("java.lang."), "Marcador tecnico JAVA_LANG presente."),
                () -> assertFalse(corpo.contains("VALOR-REJEITADO-SENTINELA"),
                        "Marcador VALOR_REJEITADO presente."));
    }
}
