
package br.com.rpmont.conferencia.service;

import br.com.rpmont.conferencia.dtos.ValidarCodigoRecuperacaoRequestDTO;
import br.com.rpmont.conferencia.exception.RecuperacaoSenhaRejeitadaException;
import br.com.rpmont.conferencia.model.RecuperacaoSenha;
import br.com.rpmont.conferencia.model.Usuario;
import br.com.rpmont.conferencia.repository.RecuperacaoSenhaRepository;
import br.com.rpmont.conferencia.repository.UsuarioRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import br.com.rpmont.conferencia.dtos.RedefinirSenhaRequestDTO;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RecuperacaoSenhaServiceImplTest {

    @Mock
    private RecuperacaoSenhaRepository recuperacaoSenhaRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private RecuperacaoSenhaServiceImpl service;

    private Usuario usuario;
    private RecuperacaoSenha recuperacao;

    private static final String EMAIL = "teste@exemplo.com";
    private static final String CODIGO = "123456";
    private static final String HASH = "hash-simulado";

    @BeforeEach
    void prepararDados() {
        usuario = new Usuario();

        recuperacao = new RecuperacaoSenha();
        recuperacao.setUsuario(usuario);
        recuperacao.setCodigoHash(HASH);
        recuperacao.setUtilizado(false);
        recuperacao.setTentativas(0);
        recuperacao.setDataCriacao(LocalDateTime.now());
        recuperacao.setDataExpiracao(LocalDateTime.now().plusMinutes(10));
    }

    private void configurarBusca() {
        when(usuarioRepository.buscarPorEmailComBloqueio(EMAIL))
                .thenReturn(Optional.of(usuario));

        when(recuperacaoSenhaRepository
                .findTopByUsuarioAndUtilizadoFalseOrderByDataCriacaoDesc(usuario))
                .thenReturn(Optional.of(recuperacao));
    }

    private ValidarCodigoRecuperacaoRequestDTO requisicao() {
        return new ValidarCodigoRecuperacaoRequestDTO(
                EMAIL,
                CODIGO
        );
    }

    @Test
    void codigoIncorretoDeveIncrementarTentativas() {
        configurarBusca();

        when(passwordEncoder.matches(CODIGO, HASH))
                .thenReturn(false);

        RecuperacaoSenhaRejeitadaException excecao =
                assertThrows(
                        RecuperacaoSenhaRejeitadaException.class,
                        () -> service.validarCodigo(requisicao())
                );

        assertEquals(HttpStatus.BAD_REQUEST, excecao.getStatusCode());
        assertEquals(1, recuperacao.getTentativas());
        assertFalse(recuperacao.getUtilizado());

        verify(recuperacaoSenhaRepository).save(recuperacao);
        verify(usuarioRepository).buscarPorEmailComBloqueio(EMAIL);
    }

    @Test
    void quintaTentativaIncorretaDeveInvalidarCodigo() {
        recuperacao.setTentativas(4);
        configurarBusca();

        when(passwordEncoder.matches(CODIGO, HASH))
                .thenReturn(false);

        RecuperacaoSenhaRejeitadaException excecao =
                assertThrows(
                        RecuperacaoSenhaRejeitadaException.class,
                        () -> service.validarCodigo(requisicao())
                );

        assertEquals(HttpStatus.BAD_REQUEST, excecao.getStatusCode());
        assertEquals(5, recuperacao.getTentativas());
        assertTrue(recuperacao.getUtilizado());

        verify(recuperacaoSenhaRepository).save(recuperacao);
    }

    @Test
    void codigoExpiradoDeveSerInvalidado() {
        recuperacao.setDataExpiracao(
                LocalDateTime.now().minusMinutes(1)
        );

        configurarBusca();

        RecuperacaoSenhaRejeitadaException excecao =
                assertThrows(
                        RecuperacaoSenhaRejeitadaException.class,
                        () -> service.validarCodigo(requisicao())
                );

        assertEquals(HttpStatus.BAD_REQUEST, excecao.getStatusCode());
        assertTrue(recuperacao.getUtilizado());

        verify(recuperacaoSenhaRepository).save(recuperacao);
        verify(passwordEncoder, never()).matches(anyString(), anyString());
    }
    
    @Test
    void contadorNuloDeveSerTratadoComoZero() {
        recuperacao.setTentativas(null);
        configurarBusca();

        when(passwordEncoder.matches(CODIGO, HASH))
                .thenReturn(false);

        RecuperacaoSenhaRejeitadaException excecao =
                assertThrows(
                        RecuperacaoSenhaRejeitadaException.class,
                        () -> service.validarCodigo(requisicao())
                );

        assertEquals(HttpStatus.BAD_REQUEST, excecao.getStatusCode());
        assertEquals(1, recuperacao.getTentativas());
        assertFalse(recuperacao.getUtilizado());

        verify(recuperacaoSenhaRepository).save(recuperacao);
    }

    @Test
    void limiteJaAtingidoDeveRetornarHttp429() {
        recuperacao.setTentativas(5);
        configurarBusca();

        RecuperacaoSenhaRejeitadaException excecao =
                assertThrows(
                        RecuperacaoSenhaRejeitadaException.class,
                        () -> service.validarCodigo(requisicao())
                );

        assertEquals(
                HttpStatus.TOO_MANY_REQUESTS,
                excecao.getStatusCode()
        );
        assertTrue(recuperacao.getUtilizado());

        verify(recuperacaoSenhaRepository).save(recuperacao);
        verify(passwordEncoder, never()).matches(anyString(), anyString());
    }

    @Test
    void codigoCorretoDeveValidarSemIncrementarTentativas() {
        configurarBusca();

        when(passwordEncoder.matches(CODIGO, HASH))
                .thenReturn(true);

        assertDoesNotThrow(
                () -> service.validarCodigo(requisicao())
        );

        assertEquals(0, recuperacao.getTentativas());
        assertFalse(recuperacao.getUtilizado());

        verify(recuperacaoSenhaRepository, never()).save(any());
        verify(usuarioRepository).buscarPorEmailComBloqueio(EMAIL);
    }
    
    @Test
    void redefinicaoBemSucedidaDeveAtualizarSenhaEConsumirCodigo() {
        configurarBusca();

        String novaSenha = "NovaSenha@123";
        String senhaCriptografada = "hash-da-nova-senha";

        when(passwordEncoder.matches(CODIGO, HASH))
                .thenReturn(true);

        when(passwordEncoder.encode(novaSenha))
                .thenReturn(senhaCriptografada);

        RedefinirSenhaRequestDTO request =
                new RedefinirSenhaRequestDTO(
                        EMAIL,
                        CODIGO,
                        novaSenha,
                        novaSenha
                );

        assertDoesNotThrow(
                () -> service.redefinirSenha(request)
        );

        assertEquals(
                senhaCriptografada,
                usuario.getSenha()
        );

        assertNotNull(usuario.getDataModificacao());
        assertTrue(recuperacao.getUtilizado());

        verify(usuarioRepository)
                .buscarPorEmailComBloqueio(EMAIL);

        verify(usuarioRepository)
                .save(usuario);

        verify(recuperacaoSenhaRepository)
                .save(recuperacao);

        verify(passwordEncoder)
                .encode(novaSenha);
    }


}
