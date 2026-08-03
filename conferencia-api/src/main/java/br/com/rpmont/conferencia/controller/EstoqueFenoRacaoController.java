package br.com.rpmont.conferencia.controller;

import br.com.rpmont.conferencia.dtos.CadastrarEntradaFenoRacaoRequestDTO;
import br.com.rpmont.conferencia.dtos.EntradaFenoRacaoResponseDTO;
import br.com.rpmont.conferencia.dtos.LoteFenoRacaoResponseDTO;
import br.com.rpmont.conferencia.enums.SituacaoLoteFenoRacao;
import br.com.rpmont.conferencia.enums.TipoProdutoFenoRacao;
import br.com.rpmont.conferencia.model.Usuario;
import br.com.rpmont.conferencia.service.EstoqueFenoRacaoService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import br.com.rpmont.conferencia.dtos.ResumoEstoqueTransferenciaDTO;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/feno-racao/estoque")
@RequiredArgsConstructor
@Validated
public class EstoqueFenoRacaoController {

    private final EstoqueFenoRacaoService estoqueService;

    /*
     * ==========================================
     * CADASTRAR ENTRADA
     * ==========================================
     */

    @PostMapping("/entradas")
    @ResponseStatus(HttpStatus.CREATED)
    public EntradaFenoRacaoResponseDTO cadastrarEntrada(
            @Valid
            @RequestBody
            CadastrarEntradaFenoRacaoRequestDTO request,

            Authentication authentication
    ) {
        return estoqueService.cadastrarEntrada(
                request,
                obterMatriculaUsuario(authentication)
        );
    }

    /*
     * ==========================================
     * LISTAR ESTOQUE
     * ==========================================
     */

    @GetMapping
    public List<LoteFenoRacaoResponseDTO> listarEstoque(
            @RequestParam(required = false)
            TipoProdutoFenoRacao tipoProduto,

            @RequestParam(required = false)
            @DecimalMin(
                    value = "0.01",
                    message = "O peso por unidade deve ser maior que zero."
            )
            BigDecimal pesoUnidadeKg,

            @RequestParam(required = false)
            SituacaoLoteFenoRacao situacao,

            @RequestParam(required = false)
            String unidade,

            Authentication authentication
    ) {
        return estoqueService.listarEstoque(
                tipoProduto,
                pesoUnidadeKg,
                situacao,
                normalizarParametroOpcional(unidade),
                obterMatriculaUsuario(authentication)
        );
    }

    /*
     * ==========================================
     * BUSCAR LOTE POR ID
     * ==========================================
     */

    @GetMapping("/lotes/{loteId}")
    public LoteFenoRacaoResponseDTO buscarLotePorId(
            @PathVariable
            @Positive(message = "O ID do lote deve ser maior que zero.")
            Integer loteId,

            Authentication authentication
    ) {
        return estoqueService.buscarLotePorId(
                loteId,
                obterMatriculaUsuario(authentication)
        );
    }

    /*
     * ==========================================
     * LISTAR LOTES DISPONÍVEIS
     * ==========================================
     */

    @GetMapping("/lotes/disponiveis")
    public List<LoteFenoRacaoResponseDTO> listarLotesDisponiveis(
            @RequestParam
            TipoProdutoFenoRacao tipoProduto,

            @RequestParam
            @DecimalMin(
                    value = "0.01",
                    message = "O peso por unidade deve ser maior que zero."
            )
            BigDecimal pesoUnidadeKg,

            @RequestParam(required = false)
            String unidade,

            Authentication authentication
    ) {
        return estoqueService.listarLotesDisponiveis(
                tipoProduto,
                pesoUnidadeKg,
                normalizarParametroOpcional(unidade),
                obterMatriculaUsuario(authentication)
        );
    }

    /*
     * ==========================================
     * ATUALIZAR ENTRADA
     * ==========================================
     */

    @PutMapping("/entradas/{loteId}")
    public EntradaFenoRacaoResponseDTO atualizarEntrada(
            @PathVariable
            @Positive(message = "O ID do lote deve ser maior que zero.")
            Integer loteId,

            @Valid
            @RequestBody
            CadastrarEntradaFenoRacaoRequestDTO request,

            Authentication authentication
    ) {
        return estoqueService.atualizarEntrada(
                loteId,
                request,
                obterMatriculaUsuario(authentication)
        );
    }

    @GetMapping("/resumo-transferencia")
    public List<ResumoEstoqueTransferenciaDTO> consultarResumoTransferencia(
            @RequestParam
            @NotBlank(message = "A unidade de origem é obrigatória.")
            String unidade,
            Authentication authentication
    ) {
        return estoqueService.consultarResumoTransferencia(
                unidade.trim(),
                obterMatriculaUsuario(authentication)
        );
    }


    /*
     * ==========================================
     * CANCELAR ENTRADA
     * ==========================================
     */

    @PatchMapping("/entradas/{loteId}/cancelar")
    public EntradaFenoRacaoResponseDTO cancelarEntrada(
            @PathVariable
            @Positive(message = "O ID do lote deve ser maior que zero.")
            Integer loteId,

            @RequestParam
            @NotBlank(message = "O motivo do cancelamento é obrigatório.")
            String motivo,

            Authentication authentication
    ) {
        return estoqueService.cancelarEntrada(
                loteId,
                motivo.trim(),
                obterMatriculaUsuario(authentication)
        );
    }

    /*
     * ==========================================
     * MATRÍCULA DO USUÁRIO AUTENTICADO
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
                    usuario.getMatricula();

            if (
                    matricula == null ||
                            matricula.isBlank()
            ) {
                throw new AuthenticationCredentialsNotFoundException(
                        "A matrícula do usuário autenticado não foi encontrada."
                );
            }

            return matricula.trim();
        }

        String nomeAutenticacao =
                authentication.getName();

        if (
                nomeAutenticacao == null ||
                        nomeAutenticacao.isBlank() ||
                        "anonymousUser".equalsIgnoreCase(
                                nomeAutenticacao
                        )
        ) {
            throw new AuthenticationCredentialsNotFoundException(
                    "Usuário autenticado não identificado."
            );
        }

        return nomeAutenticacao.trim();
    }

    /*
     * ==========================================
     * NORMALIZAÇÃO DE PARÂMETRO OPCIONAL
     * ==========================================
     */

    private String normalizarParametroOpcional(
            String valor
    ) {
        if (
                valor == null ||
                        valor.isBlank()
        ) {
            return null;
        }

        return valor.trim();
    }
}