package br.com.rpmont.conferencia.controller;

import br.com.rpmont.conferencia.dtos.MovimentacaoMaterialFiltroDTO;
import br.com.rpmont.conferencia.exception.ForbiddenException;
import br.com.rpmont.conferencia.exception.ResourceNotFoundException;
import br.com.rpmont.conferencia.model.Usuario;
import br.com.rpmont.conferencia.service.MovimentacaoMaterialService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.Authentication;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/** Chamada Java direta, sem MockMvc ou contexto Spring. */
class MovimentacaoMaterialControllerIsolamentoTest {
    private MovimentacaoMaterialService service;
    private MovimentacaoMaterialController controller;

    @BeforeEach
    void preparar() {
        service = mock(MovimentacaoMaterialService.class);
        controller = new MovimentacaoMaterialController(service);
    }

    private Authentication autenticado(Object principal) {
        Authentication auth = mock(Authentication.class);
        when(auth.isAuthenticated()).thenReturn(true);
        when(auth.getPrincipal()).thenReturn(principal);
        return auth;
    }

    private Usuario usuario() {
        Usuario usuario = new Usuario();
        usuario.setId(7L);
        usuario.setMatricula("matricula-nao-e-id");
        return usuario;
    }

    @Test
    void listaUsandoIdDoPrincipalEPreservaFiltroEResposta() {
        Authentication auth = autenticado(usuario());
        var filtro = new MovimentacaoMaterialFiltroDTO(null, null, null, null,
                null, null, null, null, null, "3EPMONT", null, null, null, null);
        when(service.listarMovimentacoes(filtro, 7L)).thenReturn(List.of());
        var resposta = controller.listarMovimentacoes(filtro, auth);
        assertEquals(200, resposta.getStatusCode().value());
        assertEquals(List.of(), resposta.getBody());
        verify(service).listarMovimentacoes(same(filtro), eq(7L));
        verify(auth, never()).getName();
        verifyNoMoreInteractions(service);
    }

    @Test
    void historicoUsaIdDoPrincipalEPreservaIdDoMaterial() {
        Authentication auth = autenticado(usuario());
        when(service.listarHistoricoPorMaterial(11L, 7L)).thenReturn(List.of());
        var resposta = controller.listarHistoricoPorMaterial(11L, auth);
        assertEquals(200, resposta.getStatusCode().value());
        assertEquals(List.of(), resposta.getBody());
        verify(service).listarHistoricoPorMaterial(11L, 7L);
        verify(auth, never()).getName();
        verifyNoMoreInteractions(service);
    }

    @Test
    void rejeitaAutenticacaoAusenteNaoAutenticadaOuPrincipalInvalido() {
        Usuario semId = new Usuario();
        Authentication naoAutenticado = mock(Authentication.class);
        for (Authentication auth : new Authentication[]{null, naoAutenticado,
                autenticado("anonymousUser"), autenticado(null), autenticado(semId)}) {
            assertThrows(ForbiddenException.class, () -> controller.listarMovimentacoes(null, auth));
            assertThrows(ForbiddenException.class, () -> controller.listarHistoricoPorMaterial(11L, auth));
        }
        verifyNoInteractions(service);
    }

    @Test
    void propagaNegacaoENaoEncontradoSemTransformarEmSucesso() {
        Authentication auth = autenticado(usuario());
        ForbiddenException proibido = new ForbiddenException("Acesso negado.");
        ResourceNotFoundException ausente = new ResourceNotFoundException("Material patrimonial não encontrado.");
        when(service.listarMovimentacoes(null, 7L)).thenThrow(proibido);
        when(service.listarHistoricoPorMaterial(11L, 7L)).thenThrow(ausente);
        assertSame(proibido, assertThrows(ForbiddenException.class,
                () -> controller.listarMovimentacoes(null, auth)));
        assertSame(ausente, assertThrows(ResourceNotFoundException.class,
                () -> controller.listarHistoricoPorMaterial(11L, auth)));
        // O mapeamento efetivo para HTTP 403/404 não é validado pela chamada Java direta.
    }
}
