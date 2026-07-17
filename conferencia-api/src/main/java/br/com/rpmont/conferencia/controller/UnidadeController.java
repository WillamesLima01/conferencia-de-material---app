package br.com.rpmont.conferencia.controller;

import br.com.rpmont.conferencia.dtos.UnidadeRequestDTO;
import br.com.rpmont.conferencia.dtos.UnidadeResponseDTO;
import br.com.rpmont.conferencia.model.Usuario;
import br.com.rpmont.conferencia.service.UnidadeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/unidades")
@RequiredArgsConstructor
public class UnidadeController {

    private final UnidadeService unidadeService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UnidadeResponseDTO cadastrar(
            @Valid
            @RequestBody
            UnidadeRequestDTO request,

            Authentication authentication
    ) {
        return unidadeService.cadastrar(
                request,
                obterUsuarioAutenticado(authentication)
        );
    }

    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public List<UnidadeResponseDTO> listarTodas(
            Authentication authentication
    ) {
        return unidadeService.listarTodas(
                obterUsuarioAutenticado(authentication)
        );
    }

    @GetMapping("/ativas")
    @ResponseStatus(HttpStatus.OK)
    public List<UnidadeResponseDTO> listarAtivas(
            Authentication authentication
    ) {
        return unidadeService.listarAtivas(
                obterUsuarioAutenticado(authentication)
        );
    }

    @GetMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public UnidadeResponseDTO buscarPorId(
            @PathVariable
            Long id,

            Authentication authentication
    ) {
        return unidadeService.buscarPorId(
                id,
                obterUsuarioAutenticado(authentication)
        );
    }

    @PatchMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public UnidadeResponseDTO atualizar(
            @PathVariable
            Long id,

            @Valid
            @RequestBody
            UnidadeRequestDTO request,

            Authentication authentication
    ) {
        return unidadeService.atualizar(
                id,
                request,
                obterUsuarioAutenticado(authentication)
        );
    }

    @PatchMapping("/{id}/inativar")
    @ResponseStatus(HttpStatus.OK)
    public UnidadeResponseDTO inativar(
            @PathVariable
            Long id,

            Authentication authentication
    ) {
        return unidadeService.inativar(
                id,
                obterUsuarioAutenticado(authentication)
        );
    }

    @PatchMapping("/{id}/reativar")
    @ResponseStatus(HttpStatus.OK)
    public UnidadeResponseDTO reativar(
            @PathVariable
            Long id,

            Authentication authentication
    ) {
        return unidadeService.reativar(
                id,
                obterUsuarioAutenticado(authentication)
        );
    }

    private Usuario obterUsuarioAutenticado(
            Authentication authentication
    ) {
        if (
                authentication == null ||
                        authentication.getPrincipal() == null
        ) {
            throw new IllegalArgumentException(
                    "Usuário autenticado não identificado."
            );
        }

        Object principal =
                authentication.getPrincipal();

        if (!(principal instanceof Usuario usuario)) {
            throw new IllegalArgumentException(
                    "Usuário autenticado inválido."
            );
        }

        return usuario;
    }
}