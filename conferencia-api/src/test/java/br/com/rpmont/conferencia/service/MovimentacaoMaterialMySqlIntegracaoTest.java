package br.com.rpmont.conferencia.service;

import br.com.rpmont.conferencia.support.PatrimonioHomologacaoFixture;
import br.com.rpmont.conferencia.enums.SituacaoMaterial;
import br.com.rpmont.conferencia.exception.ForbiddenException;
import br.com.rpmont.conferencia.exception.ResourceNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.parallel.Execution;
import org.junit.jupiter.api.parallel.ExecutionMode;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.ContextConfiguration;
import java.util.List;
import java.util.Set;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(classes = PatrimonioHomologacaoFixture.Configuracao.class,
        webEnvironment = SpringBootTest.WebEnvironment.MOCK, properties = {
        "spring.config.location=classpath:/application-homolog.properties",
        "spring.profiles.include=", "spring.datasource.url=" + PatrimonioHomologacaoFixture.URL,
        "spring.jpa.hibernate.ddl-auto=validate", "spring.main.web-application-type=servlet",
        "spring.jpa.show-sql=false", "logging.level.org.hibernate.SQL=OFF",
        "logging.level.org.hibernate.orm.jdbc.bind=OFF"})
@ContextConfiguration(initializers = PatrimonioHomologacaoFixture.DestinoLocal.class)
@ActiveProfiles("homolog")
@Execution(ExecutionMode.SAME_THREAD)
class MovimentacaoMaterialMySqlIntegracaoTest extends PatrimonioHomologacaoFixture {

    @ParameterizedTest
    @CsvSource({"2,P4", "3,P4", "2,COMANDO", "2,SUB-COMANDO", "2,SUBCOMANDO"})
    void perfisLocaisConsultamSomenteUnidadeAtual(int nivel, String setor) {
        var usuario = usuario(nivel, setor, unidadeA);
        var antes = snapshot();
        assertEquals(List.of(movimentoA2, movimentoA1), ids(service.listarMovimentacoes(null, usuario.getId())));
        assertEquals(List.of(movimentoA2, movimentoA1), ids(service.listarHistoricoPorMaterial(materialA.getId(), usuario.getId())));
        var externo = assertThrows(ResourceNotFoundException.class,
                () -> service.listarHistoricoPorMaterial(materialB.getId(), usuario.getId()));
        var inexistente = assertThrows(ResourceNotFoundException.class,
                () -> service.listarHistoricoPorMaterial(-1L, usuario.getId()));
        assertEquals(inexistente.getMessage(), externo.getMessage());
        assertTrue(antes.equals(snapshot()), "Consultas nao podem alterar materiais ou movimentos.");
    }

    @ParameterizedTest
    @ValueSource(ints = {0, 1, 2, 3})
    void filtrosNaoUltrapassamUnidade(int caso) {
        var usuario = usuario(2, "P4", unidadeA);
        var selecionado = switch (caso) {
            case 0 -> filtro(unidadeB, null, null);
            case 1 -> filtro(null, materialB.getId(), null);
            case 2 -> filtro(null, null, materialB.getNumeroSerie());
            case 3 -> filtro(unidadeB, materialB.getId(), materialB.getNumeroSerie());
            default -> throw new IllegalArgumentException("Caso de teste desconhecido.");
        };
        var resultado = service.listarMovimentacoes(selecionado, usuario.getId());
        assertEquals(caso == 0 ? List.of(movimentoA2, movimentoA1) : List.of(), ids(resultado));
        assertTrue(resultado.stream().allMatch(m -> materialA.getId().equals(m.materialId())),
                "Filtro opcional nao pode autorizar material externo.");
        assertFalse(ids(resultado).contains(movimentoB));
    }

    @Test
    void adminMasterConsultaAmbasUnidadesEAplicaFiltro() {
        String unidadeC = "TESTE-C-" + marca;
        var materialC = material(unidadeC, SituacaoMaterial.ATIVO);
        Long movimentoC = movimento(materialC, 4, unidadeC, unidadeC);
        var globais = ids(service.listarMovimentacoes(null, autor.getId()));
        assertTrue(globais.containsAll(List.of(movimentoA1, movimentoA2, movimentoB, movimentoC)));
        assertEquals(Set.of(movimentoA1, movimentoA2, movimentoB, movimentoC),
                Set.copyOf(ids(service.listarMovimentacoes(filtro(null, null, null), autor.getId()))));
        assertEquals(List.of(movimentoB, movimentoA2, movimentoA1),
                ids(service.listarMovimentacoes(filtro(unidadeB, null, null), autor.getId())));
        assertEquals(List.of(movimentoB), ids(service.listarHistoricoPorMaterial(materialB.getId(), autor.getId())));
    }

    @Test
    void normalizaSomenteEspacosExternosEMaiusculasAscii() {
        var usuario = usuario(2, " p4 ", "  " + unidadeA.toLowerCase(java.util.Locale.ROOT) + "  ");
        alterarUnidade(materialA, " " + unidadeA.toUpperCase(java.util.Locale.ROOT) + " ");
        assertEquals(List.of(movimentoA2, movimentoA1), ids(service.listarMovimentacoes(null, usuario.getId())));
        assertEquals(List.of(movimentoA2, movimentoA1), ids(service.listarHistoricoPorMaterial(materialA.getId(), usuario.getId())));
    }

    @ParameterizedTest
    @EnumSource(value = SituacaoMaterial.class, names = {"ATIVO", "INATIVO", "BAIXADO", "DESCARTADO"})
    void preservaHistoricoIndependentementeDaSituacao(SituacaoMaterial situacao) {
        var usuario = usuario(3, "P4", unidadeA);
        var material = material(unidadeA, situacao);
        Long movimento = movimento(material, 4, unidadeB, unidadeA);
        assertEquals(List.of(movimento), ids(service.listarHistoricoPorMaterial(material.getId(), usuario.getId())));
        assertTrue(ids(service.listarMovimentacoes(null, usuario.getId())).contains(movimento));
    }

    @Test
    void transferenciaSegueUnidadeAtualSemUsarOrigemOuDestinoComoAutorizacao() {
        // Caracteriza a politica atual explicitada no plano; nao decide quem deveria
        // conservar acesso historico apos uma transferencia entre unidades.
        var usuarioA = usuario(2, "P4", unidadeA);
        var usuarioB = usuario(2, "P4", unidadeB);
        assertEquals(List.of(movimentoA2, movimentoA1), ids(service.listarHistoricoPorMaterial(materialA.getId(), usuarioA.getId())));
        assertThrows(ResourceNotFoundException.class,
                () -> service.listarHistoricoPorMaterial(materialA.getId(), usuarioB.getId()));
        alterarUnidade(materialA, unidadeB);
        assertTrue(service.listarMovimentacoes(null, usuarioA.getId()).isEmpty());
        assertThrows(ResourceNotFoundException.class,
                () -> service.listarHistoricoPorMaterial(materialA.getId(), usuarioA.getId()));
        assertEquals(List.of(movimentoA2, movimentoA1), ids(service.listarHistoricoPorMaterial(materialA.getId(), usuarioB.getId())));
        assertEquals(Set.of(movimentoA1, movimentoA2, movimentoB),
                Set.copyOf(ids(service.listarMovimentacoes(filtro(null, null, null), usuarioB.getId()))));
    }

    @Test
    void bloqueioRecarregadoImpedeConsultaMesmoParaAdminMaster() {
        alterarUsuario(autor, u -> u.setAtivo(false));
        assertThrows(ForbiddenException.class, () -> service.listarMovimentacoes(null, autor.getId()));
        assertThrows(ForbiddenException.class, () -> service.listarHistoricoPorMaterial(materialA.getId(), autor.getId()));
    }
}
