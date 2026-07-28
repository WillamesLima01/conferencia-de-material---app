package br.com.rpmont.conferencia.controller;

import br.com.rpmont.conferencia.dtos.ProdutoFenoRacaoRequestDTO;
import br.com.rpmont.conferencia.dtos.ProdutoFenoRacaoResponseDTO;
import br.com.rpmont.conferencia.enums.TipoProdutoFenoRacao;
import br.com.rpmont.conferencia.model.Usuario;
import br.com.rpmont.conferencia.service.ProdutoFenoRacaoService;
import jakarta.validation.Valid;
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

import java.util.List;

@RestController
@RequestMapping("/feno-racao/produtos")
@RequiredArgsConstructor
@Validated
public class ProdutoFenoRacaoController {

    private final ProdutoFenoRacaoService produtoService;

    /*
     * ==========================================
     * CADASTRAR
     * ==========================================
     */

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProdutoFenoRacaoResponseDTO cadastrar(
            @Valid @RequestBody ProdutoFenoRacaoRequestDTO request,
            Authentication authentication
    ) {
        return produtoService.cadastrar(
                request,
                obterMatriculaUsuario(authentication)
        );
    }

    /*
     * ==========================================
     * LISTAR PRODUTOS ATIVOS
     * ==========================================
     */

    @GetMapping
    public List<ProdutoFenoRacaoResponseDTO> listarAtivos(
            @RequestParam(required = false)
            TipoProdutoFenoRacao tipoProduto,
            Authentication authentication
    ) {
        return produtoService.listarAtivos(
                tipoProduto,
                obterMatriculaUsuario(authentication)
        );
    }

    /*
     * ==========================================
     * BUSCAR POR ID
     * ==========================================
     */

    @GetMapping("/{produtoId}")
    public ProdutoFenoRacaoResponseDTO buscarPorId(
            @PathVariable
            @Positive(message = "O ID do produto deve ser maior que zero.")
            Integer produtoId,
            Authentication authentication
    ) {
        return produtoService.buscarPorId(
                produtoId,
                obterMatriculaUsuario(authentication)
        );
    }

    /*
     * ==========================================
     * ATUALIZAR
     * ==========================================
     */

    @PutMapping("/{produtoId}")
    public ProdutoFenoRacaoResponseDTO atualizar(
            @PathVariable
            @Positive(message = "O ID do produto deve ser maior que zero.")
            Integer produtoId,

            @Valid @RequestBody
            ProdutoFenoRacaoRequestDTO request,

            Authentication authentication
    ) {
        return produtoService.atualizar(
                produtoId,
                request,
                obterMatriculaUsuario(authentication)
        );
    }

    /*
     * ==========================================
     * INATIVAR
     * ==========================================
     */

    @PatchMapping("/{produtoId}/inativar")
    public ProdutoFenoRacaoResponseDTO inativar(
            @PathVariable
            @Positive(message = "O ID do produto deve ser maior que zero.")
            Integer produtoId,
            Authentication authentication
    ) {
        return produtoService.inativar(
                produtoId,
                obterMatriculaUsuario(authentication)
        );
    }

    /*
     * ==========================================
     * REATIVAR
     * ==========================================
     */

    @PatchMapping("/{produtoId}/reativar")
    public ProdutoFenoRacaoResponseDTO reativar(
            @PathVariable
            @Positive(message = "O ID do produto deve ser maior que zero.")
            Integer produtoId,
            Authentication authentication
    ) {
        return produtoService.reativar(
                produtoId,
                obterMatriculaUsuario(authentication)
        );
    }

    /*
     * ==========================================
     * OBTER MATRÍCULA DO USUÁRIO AUTENTICADO
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

        Object principal = authentication.getPrincipal();

        if (principal instanceof Usuario usuario) {
            String matricula = usuario.getMatricula();

            if (
                    matricula == null ||
                            matricula.isBlank()
            ) {
                throw new AuthenticationCredentialsNotFoundException(
                        "O usuário autenticado não possui matrícula cadastrada."
                );
            }

            return matricula.trim();
        }

        String nomeAutenticacao = authentication.getName();

        if (
                nomeAutenticacao == null ||
                        nomeAutenticacao.isBlank() ||
                        "anonymousUser".equalsIgnoreCase(nomeAutenticacao)
        ) {
            throw new AuthenticationCredentialsNotFoundException(
                    "Usuário autenticado não identificado."
            );
        }

        return nomeAutenticacao.trim();
    }
}