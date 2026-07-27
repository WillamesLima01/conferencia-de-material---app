package br.com.rpmont.conferencia.controller;

import br.com.rpmont.conferencia.dtos.ProdutoFenoRacaoRequestDTO;
import br.com.rpmont.conferencia.dtos.ProdutoFenoRacaoResponseDTO;
import br.com.rpmont.conferencia.enums.TipoProdutoFenoRacao;
import br.com.rpmont.conferencia.exception.BusinessException;
import br.com.rpmont.conferencia.model.Usuario;
import br.com.rpmont.conferencia.service.ProdutoFenoRacaoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
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
                obterMatriculaUsuario(
                        authentication
                )
        );
    }

    /*
     * ==========================================
     * LISTAR PRODUTOS ATIVOS
     * ==========================================
     */

    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public List<ProdutoFenoRacaoResponseDTO> listarAtivos(
            @RequestParam(required = false)
            TipoProdutoFenoRacao tipoProduto,
            Authentication authentication
    ) {
        return produtoService.listarAtivos(
                tipoProduto,
                obterMatriculaUsuario(
                        authentication
                )
        );
    }

    /*
     * ==========================================
     * BUSCAR POR ID
     * ==========================================
     */

    @GetMapping("/{produtoId}")
    @ResponseStatus(HttpStatus.OK)
    public ProdutoFenoRacaoResponseDTO buscarPorId(
            @PathVariable Integer produtoId,
            Authentication authentication
    ) {
        return produtoService.buscarPorId(
                produtoId,
                obterMatriculaUsuario(
                        authentication
                )
        );
    }

    /*
     * ==========================================
     * ATUALIZAR
     * ==========================================
     */

    @PutMapping("/{produtoId}")
    @ResponseStatus(HttpStatus.OK)
    public ProdutoFenoRacaoResponseDTO atualizar(
            @PathVariable Integer produtoId,
            @Valid @RequestBody ProdutoFenoRacaoRequestDTO request,
            Authentication authentication
    ) {
        return produtoService.atualizar(
                produtoId,
                request,
                obterMatriculaUsuario(
                        authentication
                )
        );
    }

    /*
     * ==========================================
     * INATIVAR
     * ==========================================
     */

    @PatchMapping("/{produtoId}/inativar")
    @ResponseStatus(HttpStatus.OK)
    public ProdutoFenoRacaoResponseDTO inativar(
            @PathVariable Integer produtoId,
            Authentication authentication
    ) {
        return produtoService.inativar(
                produtoId,
                obterMatriculaUsuario(
                        authentication
                )
        );
    }

    /*
     * ==========================================
     * REATIVAR
     * ==========================================
     */

    @PatchMapping("/{produtoId}/reativar")
    @ResponseStatus(HttpStatus.OK)
    public ProdutoFenoRacaoResponseDTO reativar(
            @PathVariable Integer produtoId,
            Authentication authentication
    ) {
        return produtoService.reativar(
                produtoId,
                obterMatriculaUsuario(
                        authentication
                )
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
            throw new BusinessException(
                    "Usuário autenticado não identificado."
            );
        }

        Object principal =
                authentication.getPrincipal();

        if (principal instanceof Usuario usuario) {
            if (
                    usuario.getMatricula() == null ||
                            usuario.getMatricula().isBlank()
            ) {
                throw new BusinessException(
                        "O usuário autenticado não possui matrícula cadastrada."
                );
            }

            return usuario
                    .getMatricula()
                    .trim();
        }

        String nomeAutenticacao =
                authentication.getName();

        if (
                nomeAutenticacao == null ||
                        nomeAutenticacao.isBlank()
        ) {
            throw new BusinessException(
                    "Usuário autenticado não identificado."
            );
        }

        return nomeAutenticacao.trim();
    }
}