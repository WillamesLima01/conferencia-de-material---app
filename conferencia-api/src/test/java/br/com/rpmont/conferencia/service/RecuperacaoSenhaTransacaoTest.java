
package br.com.rpmont.conferencia.service;

import br.com.rpmont.conferencia.dtos.RedefinirSenhaRequestDTO;
import br.com.rpmont.conferencia.dtos.SolicitarRecuperacaoSenhaRequestDTO;
import br.com.rpmont.conferencia.dtos.ValidarCodigoRecuperacaoRequestDTO;
import br.com.rpmont.conferencia.exception.RecuperacaoSenhaRejeitadaException;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.lang.reflect.Method;
import java.util.Arrays;

import static org.junit.jupiter.api.Assertions.*;

class RecuperacaoSenhaTransacaoTest {

    @Test
    void solicitarRecuperacaoDevePreservarAlteracoesNaRejeicao() throws Exception {
        verificarConfiguracao(
                "solicitarRecuperacao",
                SolicitarRecuperacaoSenhaRequestDTO.class
        );
    }

    @Test
    void validarCodigoDevePreservarAlteracoesNaRejeicao() throws Exception {
        verificarConfiguracao(
                "validarCodigo",
                ValidarCodigoRecuperacaoRequestDTO.class
        );
    }

    @Test
    void redefinirSenhaDevePreservarAlteracoesNaRejeicao() throws Exception {
        verificarConfiguracao(
                "redefinirSenha",
                RedefinirSenhaRequestDTO.class
        );
    }

    @Test
    void excecaoDeRejeicaoDeveManterStatusHttp() {
        RecuperacaoSenhaRejeitadaException excecao =
                new RecuperacaoSenhaRejeitadaException(
                        HttpStatus.TOO_MANY_REQUESTS,
                        "Limite de tentativas excedido."
                );

        assertInstanceOf(ResponseStatusException.class, excecao);
        assertEquals(
                HttpStatus.TOO_MANY_REQUESTS,
                excecao.getStatusCode()
        );
    }

    private void verificarConfiguracao(
            String nomeMetodo,
            Class<?> tipoParametro
    ) throws Exception {

        Method metodo = RecuperacaoSenhaServiceImpl.class
                .getMethod(nomeMetodo, tipoParametro);

        Transactional transacao =
                metodo.getAnnotation(Transactional.class);

        assertNotNull(
                transacao,
                "O método " + nomeMetodo + " precisa ser transacional."
        );

        assertTrue(
                Arrays.asList(transacao.noRollbackFor())
                        .contains(RecuperacaoSenhaRejeitadaException.class),
                "O método " + nomeMetodo
                        + " precisa preservar alterações na rejeição."
        );

        assertTrue(
                Arrays.stream(transacao.noRollbackFor())
                        .allMatch(
                                RecuperacaoSenhaRejeitadaException.class::isAssignableFrom
                        ),
                "A configuração não deve dispensar rollback "
                        + "de exceções inesperadas."
        );

        assertEquals(
                0,
                transacao.noRollbackForClassName().length,
                "Não deve haver regras adicionais de noRollbackFor por nome."
        );
    }
}
