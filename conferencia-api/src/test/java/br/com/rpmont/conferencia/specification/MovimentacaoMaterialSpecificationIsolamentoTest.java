package br.com.rpmont.conferencia.specification;

import br.com.rpmont.conferencia.dtos.MovimentacaoMaterialFiltroDTO;
import br.com.rpmont.conferencia.enums.SituacaoMaterial;
import br.com.rpmont.conferencia.model.MaterialPatrimonial;
import br.com.rpmont.conferencia.model.MovimentacaoMaterial;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.LocalDate;
import java.util.Arrays;

import static br.com.rpmont.conferencia.specification.MovimentacaoMaterialSpecification.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/** Verifica a construção Criteria; não executa SQL nem reproduz a collation do banco. */
@SuppressWarnings("unchecked")
class MovimentacaoMaterialSpecificationIsolamentoTest {
    private Root<MovimentacaoMaterial> root;
    private Join<MovimentacaoMaterial, MaterialPatrimonial> material;
    private CriteriaQuery<?> query;
    private CriteriaBuilder cb;
    private Path<String> unidade;
    private Expression<String> aparada;
    private Expression<String> normalizada;
    private Predicate limite;

    @BeforeEach
    void preparar() {
        root = mock(Root.class);
        material = mock(Join.class);
        query = mock(CriteriaQuery.class);
        cb = mock(CriteriaBuilder.class);
        unidade = mock(Path.class);
        aparada = mock(Expression.class);
        normalizada = mock(Expression.class);
        limite = mock(Predicate.class);
        when(root.<MovimentacaoMaterial, MaterialPatrimonial>join("material", JoinType.INNER))
                .thenReturn(material);
        when(material.<String>get("unidade")).thenReturn(unidade);
        when(cb.trim(unidade)).thenReturn(aparada);
        when(cb.lower(aparada)).thenReturn(normalizada);
        when(cb.equal(normalizada, "rpmont")).thenReturn(limite);
    }

    @Test
    void autorizacaoUsaIgualdadeNormalizadaDaUnidadeAtualSemLikeNemOrigemDestino() {
        assertSame(limite, daUnidadeAtualDoMaterial(" RPMONT ").toPredicate(root, query, cb));
        verify(root).join("material", JoinType.INNER);
        verify(material).get("unidade");
        verify(cb).trim(unidade);
        verify(cb).lower(aparada);
        verify(cb).equal(normalizada, "rpmont");
        verifyNoMoreInteractions(root, material, cb);
    }

    @Test
    void rpmontE3epmontProduzemValoresDeIgualdadeDistintos() {
        Predicate outra = mock(Predicate.class);
        when(cb.equal(normalizada, "3epmont")).thenReturn(outra);
        assertSame(limite, daUnidadeAtualDoMaterial("RPMONT").toPredicate(root, query, cb));
        assertSame(outra, daUnidadeAtualDoMaterial("3EPMONT").toPredicate(root, query, cb));
        ArgumentCaptor<String> valores = ArgumentCaptor.forClass(String.class);
        verify(cb, times(2)).equal(eq(normalizada), valores.capture());
        assertEquals(java.util.List.of("rpmont", "3epmont"), valores.getAllValues());
        // A diferença dos parâmetros é verificada; correspondência real é lacuna de integração.
    }

    @Test
    void unidadeNulaOuVaziaFechaEscopo() {
        Predicate negado = mock(Predicate.class);
        when(cb.disjunction()).thenReturn(negado);
        for (String valor : new String[]{null, "", "   "}) {
            assertSame(negado, daUnidadeAtualDoMaterial(valor).toPredicate(root, query, cb));
        }
        verifyNoInteractions(root);
        verify(cb, times(3)).disjunction();
        verifyNoMoreInteractions(cb);
    }

    @Test
    void filtrosOpcionaisIncluindoOrLikeECuringasFicamSobAndObrigatorio() {
        var filtro = new MovimentacaoMaterialFiltroDTO(
                LocalDate.of(2026, 1, 1), LocalDate.of(2026, 1, 31), null, 99L,
                "%", "nome", "marca", "descricao", "%", "3EPMONT%_", "%", 20L,
                SituacaoMaterial.ATIVO, SituacaoMaterial.BAIXADO);
        Path<String> origem = mock(Path.class);
        Path<String> destino = mock(Path.class);
        Expression<String> origemMinuscula = mock(Expression.class);
        Expression<String> destinoMinusculo = mock(Expression.class);
        Predicate origemLike = mock(Predicate.class);
        Predicate destinoLike = mock(Predicate.class);
        Predicate unidadesOpcionais = mock(Predicate.class);
        Predicate opcionais = mock(Predicate.class);
        Predicate resultado = mock(Predicate.class);
        when(root.<String>get("unidadeOrigem")).thenReturn(origem);
        when(root.<String>get("unidadeDestino")).thenReturn(destino);
        when(cb.lower(origem)).thenReturn(origemMinuscula);
        when(cb.lower(destino)).thenReturn(destinoMinusculo);
        when(cb.like(origemMinuscula, "%3epmont%_%")).thenReturn(origemLike);
        when(cb.like(destinoMinusculo, "%3epmont%_%")).thenReturn(destinoLike);
        when(cb.or(origemLike, destinoLike)).thenReturn(unidadesOpcionais);
        when(cb.and(any(Predicate[].class))).thenReturn(opcionais);
        when(cb.and(limite, opcionais)).thenReturn(resultado);

        assertSame(resultado, daUnidadeAtualDoMaterial("RPMONT").and(comFiltros(filtro))
                .toPredicate(root, query, cb));

        ArgumentCaptor<Predicate[]> filtros = ArgumentCaptor.forClass(Predicate[].class);
        verify(cb).and(filtros.capture());
        assertTrue(Arrays.asList(filtros.getValue()).contains(unidadesOpcionais));
        verify(cb).or(origemLike, destinoLike);
        verify(cb).equal(normalizada, "rpmont");
        verify(cb).and(limite, opcionais);
        verify(cb, never()).or(limite, opcionais);
    }

    @Test
    void filtroNuloNaoRemoveRestricaoDeUnidade() {
        Predicate semFiltro = mock(Predicate.class);
        Predicate resultado = mock(Predicate.class);
        when(cb.conjunction()).thenReturn(semFiltro);
        when(cb.and(limite, semFiltro)).thenReturn(resultado);
        assertSame(resultado, daUnidadeAtualDoMaterial("RPMONT").and(comFiltros(null))
                .toPredicate(root, query, cb));
        verify(cb).and(limite, semFiltro);
    }
}
