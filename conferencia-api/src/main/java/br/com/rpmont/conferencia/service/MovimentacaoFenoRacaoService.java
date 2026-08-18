package br.com.rpmont.conferencia.service;

import br.com.rpmont.conferencia.dtos.AjustarExtravioFenoRacaoRequestDTO;
import br.com.rpmont.conferencia.dtos.CancelarExtravioFenoRacaoRequestDTO;
import br.com.rpmont.conferencia.dtos.CancelarMovimentacaoFenoRacaoRequestDTO;
import br.com.rpmont.conferencia.dtos.MovimentacaoFenoRacaoResponseDTO;
import br.com.rpmont.conferencia.dtos.RegistrarExtravioFenoRacaoRequestDTO;
import br.com.rpmont.conferencia.dtos.RegistrarSaidaFenoRacaoRequestDTO;
import br.com.rpmont.conferencia.enums.TipoMovimentacaoFenoRacao;
import br.com.rpmont.conferencia.enums.TipoProdutoFenoRacao;

import java.time.LocalDate;
import java.util.List;

public interface MovimentacaoFenoRacaoService {

    /*
     * ==========================================
     * SAÍDA
     * ==========================================
     */

    MovimentacaoFenoRacaoResponseDTO registrarSaida(
            RegistrarSaidaFenoRacaoRequestDTO request,
            String matriculaUsuario
    );

    /*
     * ==========================================
     * EXTRAVIO
     * ==========================================
     */

    MovimentacaoFenoRacaoResponseDTO registrarExtravio(
            RegistrarExtravioFenoRacaoRequestDTO request,
            String matriculaUsuario
    );

    /*
     * Confirma integralmente o extravio.
     *
     * Exemplo:
     * informado = 5
     * confirmado = 5
     * devolvido = 0
     * status = CONFIRMADO
     */
    MovimentacaoFenoRacaoResponseDTO confirmarExtravio(
            Long movimentacaoId,
            String matriculaUsuario
    );

    /*
     * Ajusta parcialmente o extravio.
     *
     * Exemplo:
     * informado = 5
     * confirmado = 2
     * devolvido = 3
     * status = AJUSTADO
     */
    MovimentacaoFenoRacaoResponseDTO ajustarExtravio(
            Long movimentacaoId,
            AjustarExtravioFenoRacaoRequestDTO request,
            String matriculaUsuario
    );

    /*
     * Cancela integralmente o extravio.
     *
     * Exemplo:
     * informado = 5
     * confirmado = 0
     * devolvido = 5
     * status = CANCELADO
     */
    MovimentacaoFenoRacaoResponseDTO cancelarExtravio(
            Long movimentacaoId,
            CancelarExtravioFenoRacaoRequestDTO request,
            String matriculaUsuario
    );

    /*
     * ==========================================
     * CONSULTAS
     * ==========================================
     */

    MovimentacaoFenoRacaoResponseDTO buscarPorId(
            Long movimentacaoId,
            String matriculaUsuario
    );

    List<MovimentacaoFenoRacaoResponseDTO> listarPorLote(
            Integer loteId,
            String matriculaUsuario
    );

    List<MovimentacaoFenoRacaoResponseDTO> consultar(
            LocalDate dataInicial,
            LocalDate dataFinal,
            TipoProdutoFenoRacao tipoProduto,
            TipoMovimentacaoFenoRacao tipoMovimentacao,
            String unidade,
            String matriculaUsuario
    );

    /*
     * ==========================================
     * CANCELAMENTO DE SAÍDA
     * ==========================================
     *
     * Este método já existente continua sendo
     * utilizado exclusivamente no fluxo de SAÍDA.
     */

    MovimentacaoFenoRacaoResponseDTO cancelar(
            Long movimentacaoId,
            CancelarMovimentacaoFenoRacaoRequestDTO request,
            String matriculaUsuario
    );
}