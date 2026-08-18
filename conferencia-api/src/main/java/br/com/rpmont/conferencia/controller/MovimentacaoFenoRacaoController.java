package br.com.rpmont.conferencia.controller;

import br.com.rpmont.conferencia.dtos.AjustarExtravioFenoRacaoRequestDTO;
import br.com.rpmont.conferencia.dtos.CancelarExtravioFenoRacaoRequestDTO;
import br.com.rpmont.conferencia.dtos.CancelarMovimentacaoFenoRacaoRequestDTO;
import br.com.rpmont.conferencia.dtos.MovimentacaoFenoRacaoResponseDTO;
import br.com.rpmont.conferencia.dtos.RegistrarExtravioFenoRacaoRequestDTO;
import br.com.rpmont.conferencia.dtos.RegistrarSaidaFenoRacaoRequestDTO;
import br.com.rpmont.conferencia.enums.TipoMovimentacaoFenoRacao;
import br.com.rpmont.conferencia.enums.TipoProdutoFenoRacao;
import br.com.rpmont.conferencia.model.Usuario;
import br.com.rpmont.conferencia.service.MovimentacaoFenoRacaoService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/feno-racao/movimentacoes")
@RequiredArgsConstructor
@Validated
public class MovimentacaoFenoRacaoController {

    private final MovimentacaoFenoRacaoService movimentacaoService;

    /*
     * ==========================================
     * SAÍDA
     * ==========================================
     */

    @PostMapping("/saidas")
    @ResponseStatus(HttpStatus.CREATED)
    public MovimentacaoFenoRacaoResponseDTO registrarSaida(
            @Valid
            @RequestBody
            RegistrarSaidaFenoRacaoRequestDTO request,

            Authentication authentication
    ) {
        return movimentacaoService.registrarSaida(
                request,
                obterMatriculaUsuario(authentication)
        );
    }

    /*
     * ==========================================
     * EXTRAVIO
     * ==========================================
     */

    @PostMapping("/extravios")
    @ResponseStatus(HttpStatus.CREATED)
    public MovimentacaoFenoRacaoResponseDTO registrarExtravio(
            @Valid
            @RequestBody
            RegistrarExtravioFenoRacaoRequestDTO request,

            Authentication authentication
    ) {
        return movimentacaoService.registrarExtravio(
                request,
                obterMatriculaUsuario(authentication)
        );
    }

    /*
     * Confirma integralmente um extravio pendente.
     */
    @PatchMapping("/{movimentacaoId}/extravio/confirmar")
    @ResponseStatus(HttpStatus.OK)
    public MovimentacaoFenoRacaoResponseDTO confirmarExtravio(
            @PathVariable("movimentacaoId")
            @Positive(
                    message =
                            "O ID da movimentação deve ser maior que zero."
            )
            Long movimentacaoId,

            Authentication authentication
    ) {
        return movimentacaoService.confirmarExtravio(
                movimentacaoId,
                obterMatriculaUsuario(authentication)
        );
    }

    /*
     * Ajusta parcialmente um extravio pendente.
     */
    @PatchMapping("/{movimentacaoId}/extravio/ajustar")
    @ResponseStatus(HttpStatus.OK)
    public MovimentacaoFenoRacaoResponseDTO ajustarExtravio(
            @PathVariable("movimentacaoId")
            @Positive(
                    message =
                            "O ID da movimentação deve ser maior que zero."
            )
            Long movimentacaoId,

            @Valid
            @RequestBody
            AjustarExtravioFenoRacaoRequestDTO request,

            Authentication authentication
    ) {
        return movimentacaoService.ajustarExtravio(
                movimentacaoId,
                request,
                obterMatriculaUsuario(authentication)
        );
    }

    /*
     * Cancela integralmente um extravio pendente.
     */
    @PatchMapping("/{movimentacaoId}/extravio/cancelar")
    @ResponseStatus(HttpStatus.OK)
    public MovimentacaoFenoRacaoResponseDTO cancelarExtravio(
            @PathVariable("movimentacaoId")
            @Positive(
                    message =
                            "O ID da movimentação deve ser maior que zero."
            )
            Long movimentacaoId,

            @Valid
            @RequestBody
            CancelarExtravioFenoRacaoRequestDTO request,

            Authentication authentication
    ) {
        return movimentacaoService.cancelarExtravio(
                movimentacaoId,
                request,
                obterMatriculaUsuario(authentication)
        );
    }

    /*
     * ==========================================
     * CONSULTAS
     * ==========================================
     */

    @GetMapping("/{movimentacaoId}")
    @ResponseStatus(HttpStatus.OK)
    public MovimentacaoFenoRacaoResponseDTO buscarPorId(
            @PathVariable("movimentacaoId")
            @Positive(
                    message =
                            "O ID da movimentação deve ser maior que zero."
            )
            Long movimentacaoId,

            Authentication authentication
    ) {
        return movimentacaoService.buscarPorId(
                movimentacaoId,
                obterMatriculaUsuario(authentication)
        );
    }

    @GetMapping("/lote/{loteId}")
    @ResponseStatus(HttpStatus.OK)
    public List<MovimentacaoFenoRacaoResponseDTO> listarPorLote(
            @PathVariable("loteId")
            @Positive(
                    message =
                            "O ID do lote deve ser maior que zero."
            )
            Integer loteId,

            Authentication authentication
    ) {
        return movimentacaoService.listarPorLote(
                loteId,
                obterMatriculaUsuario(authentication)
        );
    }

    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public List<MovimentacaoFenoRacaoResponseDTO> consultar(
            @RequestParam("dataInicial")
            @DateTimeFormat(
                    iso = DateTimeFormat.ISO.DATE
            )
            LocalDate dataInicial,

            @RequestParam("dataFinal")
            @DateTimeFormat(
                    iso = DateTimeFormat.ISO.DATE
            )
            LocalDate dataFinal,

            @RequestParam(
                    name = "tipoProduto",
                    required = false
            )
            TipoProdutoFenoRacao tipoProduto,

            @RequestParam(
                    name = "tipoMovimentacao",
                    required = false
            )
            TipoMovimentacaoFenoRacao tipoMovimentacao,

            @RequestParam(
                    name = "unidade",
                    required = false
            )
            String unidade,

            Authentication authentication
    ) {
        return movimentacaoService.consultar(
                dataInicial,
                dataFinal,
                tipoProduto,
                tipoMovimentacao,
                normalizarTextoOpcional(unidade),
                obterMatriculaUsuario(authentication)
        );
    }

    /*
     * ==========================================
     * CANCELAMENTO DE SAÍDA
     * ==========================================
     */

    @PatchMapping("/{movimentacaoId}/cancelar")
    @ResponseStatus(HttpStatus.OK)
    public MovimentacaoFenoRacaoResponseDTO cancelar(
            @PathVariable("movimentacaoId")
            @Positive(
                    message =
                            "O ID da movimentação deve ser maior que zero."
            )
            Long movimentacaoId,

            @Valid
            @RequestBody
            CancelarMovimentacaoFenoRacaoRequestDTO request,

            Authentication authentication
    ) {
        return movimentacaoService.cancelar(
                movimentacaoId,
                request,
                obterMatriculaUsuario(authentication)
        );
    }

    /*
     * ==========================================
     * AUTENTICAÇÃO
     * ==========================================
     */

    private String obterMatriculaUsuario(
            Authentication authentication
    ) {
        if (
                authentication == null ||
                        !authentication.isAuthenticated()
        ) {
            throw new AuthenticationCredentialsNotFoundException(
                    "Usuário autenticado não identificado."
            );
        }

        Object principal =
                authentication.getPrincipal();

        if (principal instanceof Usuario usuario) {
            String matricula =
                    normalizarTextoOpcional(
                            usuario.getMatricula()
                    );

            if (matricula == null) {
                throw new AuthenticationCredentialsNotFoundException(
                        "A matrícula do usuário autenticado não foi encontrada."
                );
            }

            return matricula;
        }

        String nomeAutenticacao =
                normalizarTextoOpcional(
                        authentication.getName()
                );

        if (nomeAutenticacao == null) {
            throw new AuthenticationCredentialsNotFoundException(
                    "Usuário autenticado não identificado."
            );
        }

        return nomeAutenticacao;
    }

    private String normalizarTextoOpcional(
            String valor
    ) {
        if (valor == null) {
            return null;
        }

        String valorNormalizado =
                valor.trim();

        return valorNormalizado.isEmpty()
                ? null
                : valorNormalizado;
    }
}