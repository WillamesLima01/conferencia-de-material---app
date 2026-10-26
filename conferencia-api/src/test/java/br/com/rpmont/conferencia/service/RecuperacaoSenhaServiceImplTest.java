
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
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.MockedStatic;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import br.com.rpmont.conferencia.dtos.RedefinirSenhaRequestDTO;
import br.com.rpmont.conferencia.dtos.SolicitarRecuperacaoSenhaRequestDTO;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.List;
import java.util.stream.Stream;

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

    private static Stream<Arguments> estadosEIntervalos() {
        return Stream.of("ATIVO", "UTILIZADO", "INVALIDADO", "EXPIRADO", "EXPIRADO_INVALIDADO")
                .flatMap(estado -> Stream.of(59L, 60L, 61L)
                        .map(segundos -> Arguments.of(estado, segundos)));
    }

    @ParameterizedTest
    @MethodSource("estadosEIntervalos")
    void intervaloDeveConsiderarUltimaSolicitacaoEmQualquerEstado(String estado, long segundos) {
        LocalDateTime agora = LocalDateTime.of(2026, 10, 25, 12, 0);
        recuperacao.setDataCriacao(agora.minusSeconds(segundos));
        recuperacao.setUtilizado(estado.equals("UTILIZADO") || estado.contains("INVALIDADO"));
        recuperacao.setTentativas(estado.contains("INVALIDADO") ? 5 : 0);
        recuperacao.setDataExpiracao(estado.startsWith("EXPIRADO")
                ? agora.minusSeconds(1) : agora.plusMinutes(10));
        usuario.setEmail(EMAIL);
        usuario.setSenha("senha-ficticia-original");

        when(usuarioRepository.buscarPorEmailComBloqueio(EMAIL)).thenReturn(Optional.of(usuario));
        when(recuperacaoSenhaRepository.findTopByUsuarioOrderByDataCriacaoDescIdDesc(usuario))
                .thenReturn(Optional.of(recuperacao));
        if (segundos >= 60) {
            when(recuperacaoSenhaRepository.findAllByUsuarioAndUtilizadoFalse(usuario))
                    .thenReturn(List.of());
            when(passwordEncoder.encode(anyString())).thenReturn("hash-ficticio-novo");
        }

        LocalDateTime criacaoAnterior = recuperacao.getDataCriacao();
        LocalDateTime expiracaoAnterior = recuperacao.getDataExpiracao();
        Boolean utilizadoAnterior = recuperacao.getUtilizado();
        Integer tentativasAnteriores = recuperacao.getTentativas();
        try (MockedStatic<LocalDateTime> tempo = mockStatic(LocalDateTime.class, CALLS_REAL_METHODS)) {
            tempo.when(LocalDateTime::now).thenReturn(agora);
            if (segundos < 60) {
                ResponseStatusException rejeicao = assertThrows(ResponseStatusException.class,
                        () -> service.solicitarRecuperacao(new SolicitarRecuperacaoSenhaRequestDTO(EMAIL)));
                assertEquals(HttpStatus.TOO_MANY_REQUESTS, rejeicao.getStatusCode());
                verifyNoInteractions(passwordEncoder, emailService);
                verify(recuperacaoSenhaRepository).findTopByUsuarioOrderByDataCriacaoDescIdDesc(usuario);
                verifyNoMoreInteractions(recuperacaoSenhaRepository);
            } else {
                service.solicitarRecuperacao(new SolicitarRecuperacaoSenhaRequestDTO(EMAIL));
                verify(recuperacaoSenhaRepository).save(argThat(nova ->
                        nova != recuperacao && agora.equals(nova.getDataCriacao())
                                && Boolean.FALSE.equals(nova.getUtilizado())
                                && Integer.valueOf(0).equals(nova.getTentativas())));
                verify(emailService).enviarCodigoRecuperacao(eq(EMAIL), anyString());
            }
        }
        // A consulta usada para validar codigos nao deve ser usada pelo intervalo.
        verify(recuperacaoSenhaRepository, never())
                .findTopByUsuarioAndUtilizadoFalseOrderByDataCriacaoDesc(any());
        verify(usuarioRepository).buscarPorEmailComBloqueio(EMAIL);
        verifyNoMoreInteractions(usuarioRepository);
        assertTrue("senha-ficticia-original".equals(usuario.getSenha()));
        assertNull(usuario.getDataModificacao());
        assertTrue(HASH.equals(recuperacao.getCodigoHash()));
        assertEquals(criacaoAnterior, recuperacao.getDataCriacao());
        assertEquals(expiracaoAnterior, recuperacao.getDataExpiracao());
        assertEquals(utilizadoAnterior, recuperacao.getUtilizado());
        assertEquals(tentativasAnteriores, recuperacao.getTentativas());
    }

    @Test
    void primeiraSolicitacaoDeveSerPermitidaSemHistorico() {
        LocalDateTime agora = LocalDateTime.of(2026, 10, 25, 12, 0);
        usuario.setEmail(EMAIL);
        when(usuarioRepository.buscarPorEmailComBloqueio(EMAIL)).thenReturn(Optional.of(usuario));
        when(recuperacaoSenhaRepository.findTopByUsuarioOrderByDataCriacaoDescIdDesc(usuario))
                .thenReturn(Optional.empty());
        when(recuperacaoSenhaRepository.findAllByUsuarioAndUtilizadoFalse(usuario)).thenReturn(List.of());
        when(passwordEncoder.encode(anyString())).thenReturn("hash-ficticio-novo");
        try (MockedStatic<LocalDateTime> tempo = mockStatic(LocalDateTime.class, CALLS_REAL_METHODS)) {
            tempo.when(LocalDateTime::now).thenReturn(agora);
            service.solicitarRecuperacao(new SolicitarRecuperacaoSenhaRequestDTO(EMAIL));
            verify(recuperacaoSenhaRepository).save(argThat(nova -> agora.equals(nova.getDataCriacao())));
            verify(emailService).enviarCodigoRecuperacao(eq(EMAIL), anyString());
        }
    }

    @Test
    void rejeicoesRepetidasNaoDevemReiniciarPrazo() {
        LocalDateTime agora = LocalDateTime.of(2026, 10, 25, 12, 0);
        LocalDateTime criacao = agora.minusSeconds(30);
        recuperacao.setDataCriacao(criacao);
        when(usuarioRepository.buscarPorEmailComBloqueio(EMAIL)).thenReturn(Optional.of(usuario));
        when(recuperacaoSenhaRepository.findTopByUsuarioOrderByDataCriacaoDescIdDesc(usuario))
                .thenReturn(Optional.of(recuperacao));
        try (MockedStatic<LocalDateTime> tempo = mockStatic(LocalDateTime.class, CALLS_REAL_METHODS)) {
            tempo.when(LocalDateTime::now).thenReturn(agora, agora.plusSeconds(29));
            for (int i = 0; i < 2; i++) {
                ResponseStatusException rejeicao = assertThrows(ResponseStatusException.class,
                        () -> service.solicitarRecuperacao(new SolicitarRecuperacaoSenhaRequestDTO(EMAIL)));
                assertEquals(HttpStatus.TOO_MANY_REQUESTS, rejeicao.getStatusCode());
            }
        }
        assertEquals(criacao, recuperacao.getDataCriacao());
        verify(recuperacaoSenhaRepository, times(2)).findTopByUsuarioOrderByDataCriacaoDescIdDesc(usuario);
        verifyNoMoreInteractions(recuperacaoSenhaRepository);
        verifyNoInteractions(passwordEncoder, emailService);
    }
}
