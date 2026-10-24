package br.com.rpmont.conferencia.service;

import br.com.rpmont.conferencia.dtos.MovimentacaoMaterialFiltroDTO;
import br.com.rpmont.conferencia.enums.SituacaoMaterial;
import br.com.rpmont.conferencia.exception.ForbiddenException;
import br.com.rpmont.conferencia.exception.ResourceNotFoundException;
import br.com.rpmont.conferencia.model.MaterialPatrimonial;
import br.com.rpmont.conferencia.model.MovimentacaoMaterial;
import br.com.rpmont.conferencia.model.Usuario;
import br.com.rpmont.conferencia.repository.MaterialPatrimonialRepository;
import br.com.rpmont.conferencia.repository.MovimentacaoMaterialRepository;
import br.com.rpmont.conferencia.repository.UsuarioRepository;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class MovimentacaoMaterialIsolamentoTest {
    private MovimentacaoMaterialRepository movimentacoes;
    private MaterialPatrimonialRepository materiais;
    private UsuarioRepository usuarios;
    private MovimentacaoMaterialService service;

    @BeforeEach
    void preparar() {
        movimentacoes = mock(MovimentacaoMaterialRepository.class);
        materiais = mock(MaterialPatrimonialRepository.class);
        usuarios = mock(UsuarioRepository.class);
        service = new MovimentacaoMaterialServiceImpl(movimentacoes, materiais, usuarios);
    }

    private Usuario usuario(Integer nivel, String setor, String unidade) {
        Usuario usuario = new Usuario();
        usuario.setId(7L);
        usuario.setNivel(nivel);
        usuario.setSetor(setor);
        usuario.setUnidade(unidade);
        usuario.setAtivo(true);
        usuario.setStatusAcesso(" LIBERADO ");
        when(usuarios.findById(7L)).thenReturn(Optional.of(usuario));
        return usuario;
    }

    private MaterialPatrimonial material(String unidade, SituacaoMaterial situacao) {
        MaterialPatrimonial material = new MaterialPatrimonial();
        material.setId(11L);
        material.setUnidade(unidade);
        material.setSituacao(situacao);
        when(materiais.findById(11L)).thenReturn(Optional.of(material));
        return material;
    }

    @SuppressWarnings("unchecked")
    private Specification<MovimentacaoMaterial> listarECapturar(MovimentacaoMaterialFiltroDTO filtro) {
        when(movimentacoes.findAll(any(Specification.class), any(Sort.class))).thenReturn(List.of());
        assertTrue(service.listarMovimentacoes(filtro, 7L).isEmpty());
        ArgumentCaptor<Specification<MovimentacaoMaterial>> captor =
                ArgumentCaptor.forClass(Specification.class);
        verify(movimentacoes).findAll(captor.capture(),
                eq(Sort.by(Sort.Direction.DESC, "dataMovimentacao")));
        verify(usuarios).findById(7L);
        return captor.getValue();
    }

    @Test
    @SuppressWarnings("unchecked")
    void adminMasterListaGlobalSemSetorNemUnidade() {
        usuario(1, null, null);
        Specification<MovimentacaoMaterial> spec = listarECapturar(null);
        Root<MovimentacaoMaterial> root = mock(Root.class);
        CriteriaBuilder cb = mock(CriteriaBuilder.class);
        Predicate global = mock(Predicate.class);
        when(cb.conjunction()).thenReturn(global);
        assertSame(global, spec.toPredicate(root, mock(CriteriaQuery.class), cb));
        verifyNoInteractions(root);
    }

    @Test
    @SuppressWarnings("unchecked")
    void todosPerfisLocaisAplicamUnidadeAtualMesmoComFiltroDeOutraUnidade() {
        Object[][] perfis = {{2, "P4"}, {2, "Comando"}, {2, "SUB-COMANDO"},
                {2, "SUBCOMANDO"}, {3, " p4 "}};
        for (Object[] perfil : perfis) {
            clearInvocations(usuarios, movimentacoes);
            usuario((Integer) perfil[0], (String) perfil[1], " RPMONT ");
            var filtro = new MovimentacaoMaterialFiltroDTO(null, null, null, 99L,
                    null, null, null, null, "OUTRO", "3EPMONT", null, null, null, null);
            Specification<MovimentacaoMaterial> spec = listarECapturar(filtro);
            Root<MovimentacaoMaterial> root = mock(Root.class);
            Join<MovimentacaoMaterial, MaterialPatrimonial> join = mock(Join.class);
            Path<String> unidade = mock(Path.class);
            CriteriaBuilder cb = mock(CriteriaBuilder.class);
            Predicate limite = mock(Predicate.class);
            Predicate opcionais = mock(Predicate.class);
            Predicate combinado = mock(Predicate.class);
            when(root.<MovimentacaoMaterial, MaterialPatrimonial>join("material", JoinType.INNER))
                    .thenReturn(join);
            when(join.<String>get("unidade")).thenReturn(unidade);
            when(cb.trim(unidade)).thenReturn(unidade);
            when(cb.lower(unidade)).thenReturn(unidade);
            when(cb.equal(unidade, "rpmont")).thenReturn(limite);
            when(cb.and(any(Predicate[].class))).thenReturn(opcionais);
            when(cb.and(limite, opcionais)).thenReturn(combinado);

            assertSame(combinado, spec.toPredicate(root, mock(CriteriaQuery.class), cb));
            verify(cb).equal(unidade, "rpmont");
            verify(cb, never()).equal(unidade, "3epmont");
            verify(cb).and(limite, opcionais);
        }
    }

    @Test
    void perfisLocaisLeemHistoricoSomenteDaPropriaUnidade() {
        Object[][] perfis = {{2, "P4"}, {2, "COMANDO"}, {2, "SUB-COMANDO"},
                {2, "SUBCOMANDO"}, {3, "P4"}};
        for (Object[] perfil : perfis) {
            clearInvocations(movimentacoes);
            usuario((Integer) perfil[0], (String) perfil[1], " RPMONT ");
            material("rpmont", SituacaoMaterial.ATIVO);
            when(movimentacoes.findByMaterialIdOrderByDataMovimentacaoDesc(11L)).thenReturn(List.of());
            assertTrue(service.listarHistoricoPorMaterial(11L, 7L).isEmpty());
            clearInvocations(movimentacoes);
            material("3EPMONT", SituacaoMaterial.ATIVO);
            assertThrows(ResourceNotFoundException.class,
                    () -> service.listarHistoricoPorMaterial(11L, 7L));
            verifyNoInteractions(movimentacoes);
        }
    }

    @Test
    void adminMasterLeHistoricoDeOutraUnidadeSemSetor() {
        usuario(1, null, null);
        material("3EPMONT", SituacaoMaterial.BAIXADO);
        when(movimentacoes.findByMaterialIdOrderByDataMovimentacaoDesc(11L)).thenReturn(List.of());
        assertTrue(service.listarHistoricoPorMaterial(11L, 7L).isEmpty());
        verify(movimentacoes).findByMaterialIdOrderByDataMovimentacaoDesc(11L);
    }

    @Test
    void usuarioBloqueadoOuInativoERecusadoInclusiveAdminMaster() {
        for (int nivel : new int[]{1, 2, 3}) {
            Usuario usuario = usuario(nivel, "P4", "RPMONT");
            usuario.setAtivo(false);
            assertConsultasProibidas();
            usuario.setAtivo(null);
            assertConsultasProibidas();
            usuario.setAtivo(true);
            for (String status : new String[]{"BLOQUEADO", "PENDENTE", null, ""}) {
                usuario.setStatusAcesso(status);
                assertConsultasProibidas();
            }
        }
    }

    @Test
    void rejeitaSetoresNiveisEUnidadesNaoAutorizadosSemAproximacao() {
        Object[][] negados = {{2, "FISCAL-DE-DIA", "RPMONT"}, {3, "COMANDO", "RPMONT"},
                {3, "SUBCOMANDO", "RPMONT"}, {3, "SUB-COMANDO", "RPMONT"},
                {2, "P4 AUXILIAR", "RPMONT"}, {2, "SUB COMANDO", "RPMONT"},
                {2, null, "RPMONT"}, {2, "", "RPMONT"}, {null, "P4", "RPMONT"},
                {4, "P4", "RPMONT"}, {2, "P4", null}, {3, "P4", "   "}};
        for (Object[] perfil : negados) {
            usuario((Integer) perfil[0], (String) perfil[1], (String) perfil[2]);
            assertConsultasProibidas();
        }
    }

    private void assertConsultasProibidas() {
        assertThrows(ForbiddenException.class, () -> service.listarMovimentacoes(null, 7L));
        assertThrows(ForbiddenException.class, () -> service.listarHistoricoPorMaterial(11L, 7L));
        verifyNoInteractions(materiais, movimentacoes);
    }

    @Test
    void rejeitaUsuarioInexistenteOuIdAusente() {
        when(usuarios.findById(7L)).thenReturn(Optional.empty());
        assertConsultasProibidas();
        clearInvocations(usuarios);
        assertThrows(ForbiddenException.class, () -> service.listarMovimentacoes(null, null));
        assertThrows(ForbiddenException.class, () -> service.listarHistoricoPorMaterial(11L, null));
        verifyNoInteractions(usuarios, materiais, movimentacoes);
    }

    @Test
    void inexistenteEForaDaUnidadeTemMesmaExcecaoEMensagemSemConsultarMovimentacoes() {
        usuario(2, "P4", "RPMONT");
        when(materiais.findById(11L)).thenReturn(Optional.empty());
        var inexistente = assertThrows(ResourceNotFoundException.class,
                () -> service.listarHistoricoPorMaterial(11L, 7L));
        material("3EPMONT", SituacaoMaterial.ATIVO);
        var externo = assertThrows(ResourceNotFoundException.class,
                () -> service.listarHistoricoPorMaterial(11L, 7L));
        assertEquals(inexistente.getMessage(), externo.getMessage());
        verifyNoInteractions(movimentacoes);
    }

    @Test
    void validaUsuarioEMaterialAntesDeBuscarHistorico() {
        usuario(2, "COMANDO", "RPMONT");
        material("RPMONT", SituacaoMaterial.DESCARTADO);
        when(movimentacoes.findByMaterialIdOrderByDataMovimentacaoDesc(11L)).thenReturn(List.of());
        clearInvocations(usuarios, materiais, movimentacoes);

        assertTrue(service.listarHistoricoPorMaterial(11L, 7L).isEmpty());

        var ordem = inOrder(usuarios, materiais, movimentacoes);
        ordem.verify(usuarios).findById(7L);
        ordem.verify(materiais).findById(11L);
        ordem.verify(movimentacoes).findByMaterialIdOrderByDataMovimentacaoDesc(11L);
        ordem.verifyNoMoreInteractions();
    }

    @Test
    void cadaConsultaRecarregaUsuarioEAplicaBloqueioAtual() {
        usuario(2, "P4", "RPMONT");
        listarECapturar(null);
        clearInvocations(movimentacoes);
        Usuario bloqueado = new Usuario();
        bloqueado.setId(7L);
        bloqueado.setAtivo(false);
        when(usuarios.findById(7L)).thenReturn(Optional.of(bloqueado));

        assertThrows(ForbiddenException.class, () -> service.listarMovimentacoes(null, 7L));

        verify(usuarios, times(2)).findById(7L);
        verifyNoInteractions(movimentacoes);
    }

    @Test
    @SuppressWarnings("unchecked")
    void listagemPreservaMateriaisInativosBaixadosEDescartadosAutorizados() {
        usuario(3, "P4", "RPMONT");
        for (SituacaoMaterial situacao : new SituacaoMaterial[]{SituacaoMaterial.INATIVO,
                SituacaoMaterial.BAIXADO, SituacaoMaterial.DESCARTADO}) {
            MaterialPatrimonial material = new MaterialPatrimonial();
            material.setId(11L);
            material.setUnidade("RPMONT");
            material.setSituacao(situacao);
            MovimentacaoMaterial movimento = new MovimentacaoMaterial();
            movimento.setId(31L);
            movimento.setMaterialId(11L);
            movimento.setMaterial(material);
            // O repositório devolve dados já autorizados; não simula execução do SQL.
            when(movimentacoes.findAll(any(Specification.class), any(Sort.class)))
                    .thenReturn(List.of(movimento));

            var lista = service.listarMovimentacoes(null, 7L);

            assertEquals(1, lista.size(), situacao.name());
            assertEquals(31L, lista.getFirst().id());
        }
    }

    @Test
    void materialSemUnidadeNaoEAutorizadoParaPerfilLocal() {
        usuario(2, "P4", "RPMONT");
        for (String unidade : new String[]{null, "", "   "}) {
            material(unidade, SituacaoMaterial.INATIVO);
            assertThrows(ResourceNotFoundException.class,
                    () -> service.listarHistoricoPorMaterial(11L, 7L));
        }
        verifyNoInteractions(movimentacoes);
    }

    @Test
    void preservaHistoricoDeMateriaisForaDaSituacaoAtivo() {
        usuario(3, "P4", "RPMONT");
        for (SituacaoMaterial situacao : SituacaoMaterial.values()) {
            MaterialPatrimonial material = material("RPMONT", situacao);
            MovimentacaoMaterial movimento = new MovimentacaoMaterial();
            movimento.setId(31L);
            movimento.setMaterialId(11L);
            movimento.setMaterial(material);
            when(movimentacoes.findByMaterialIdOrderByDataMovimentacaoDesc(11L))
                    .thenReturn(List.of(movimento));
            var historico = service.listarHistoricoPorMaterial(11L, 7L);
            assertEquals(1, historico.size(), situacao.name());
            assertEquals(31L, historico.getFirst().id());
        }
    }
}
