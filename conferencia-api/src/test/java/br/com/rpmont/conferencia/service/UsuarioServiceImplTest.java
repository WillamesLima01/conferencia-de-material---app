package br.com.rpmont.conferencia.service;

import br.com.rpmont.conferencia.model.Usuario;
import br.com.rpmont.conferencia.repository.UsuarioRepository;
import br.com.rpmont.conferencia.dtos.*;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.util.List;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class UsuarioServiceImplTest {
    private UsuarioRepository repository;
    private PasswordEncoder encoder;
    private UsuarioServiceImpl service;
    private Usuario alvo;
    @BeforeEach void preparar() {
        repository = mock(UsuarioRepository.class); encoder = mock(PasswordEncoder.class);
        service = new UsuarioServiceImpl(repository, encoder);
        Usuario master = new Usuario(); master.setId(1L); master.setNivel(1); master.setMatricula("MASTER-SINTETICO");
        master.setAtivo(true); master.setStatusAcesso("LIBERADO");
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(master, null, List.of()));
        alvo = new Usuario(); alvo.setId(2L); alvo.setNivel(3); alvo.setMatricula("ALVO-SINTETICO");
        alvo.setSenha("hash-anterior"); alvo.setAtivo(true); alvo.setStatusAcesso("LIBERADO");
        alvo.setUnidade("TESTE"); alvo.setCredencialVersao(4L);
        when(repository.save(any())).thenAnswer(i -> i.getArgument(0));
    }
    @AfterEach void limpar() { SecurityContextHolder.clearContext(); }
    private UsuarioAdminRequestDTO dto(String senha) {
        return new UsuarioAdminRequestDTO("ALVO-SINTETICO", "Sintetico", senha,
                "alvo@example.invalid", 3, null, "P4", "Nome sintetico", "TESTE", "LIBERADO");
    }
    private void existente() { when(repository.findById(2L)).thenReturn(Optional.of(alvo)); }
    @ParameterizedTest @NullAndEmptySource @ValueSource(strings = {" ", "   "})
    void editarSemSenhaPreservaCredencial(String senha) {
        existente(); service.atualizarUsuarioPorId(2L, dto(senha));
        assertEquals(4, alvo.getCredencialVersao()); assertTrue("hash-anterior".equals(alvo.getSenha()));
        verifyNoInteractions(encoder);
    }
    @Test void editarComSenhaIncrementaMesmoSeHashForIgual() {
        existente(); when(encoder.encode("senha-sintetica")).thenReturn("hash-anterior");
        service.atualizarUsuarioPorId(2L, dto("senha-sintetica"));
        assertEquals(5, alvo.getCredencialVersao()); verify(repository).save(alvo);
    }
    @Test void cadastroAdministrativoComecaEmZero() {
        when(encoder.encode("senha-sintetica")).thenReturn("hash-inicial");
        service.salvarUsuario(dto("senha-sintetica"));
        var captor = org.mockito.ArgumentCaptor.forClass(Usuario.class);
        verify(repository).save(captor.capture()); assertEquals(0, captor.getValue().getCredencialVersao());
        assertNull(captor.getValue().getVersaoRegistro());
    }
    @Test void solicitacaoDeAcessoComecaEmZero() {
        when(encoder.encode("senha-sintetica")).thenReturn("hash-inicial");
        service.solicitarAcesso(new UsuarioRequestDTO("NOVA", "Nome", "senha-sintetica",
                "novo@example.invalid", null, "P4", "Nome sintetico", "TESTE"));
        var captor = org.mockito.ArgumentCaptor.forClass(Usuario.class);
        verify(repository).save(captor.capture()); assertEquals(0, captor.getValue().getCredencialVersao());
    }
    @Test void statusENivelNaoRevogamCredencial() {
        existente(); service.alterarStatusUsuario(2L, new UsuarioStatusRequestDTO("BLOQUEADO"));
        service.alterarNivelUsuario(2L, new UsuarioNivelRequestDTO(2));
        assertEquals(4, alvo.getCredencialVersao());
    }
    @Test void exclusaoUsaEntidadeCarregada() {
        existente(); service.deletarUsuarioId(2L); verify(repository).delete(alvo);
    }
}
