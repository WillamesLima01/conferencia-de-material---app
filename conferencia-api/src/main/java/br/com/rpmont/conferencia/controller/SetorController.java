package br.com.rpmont.conferencia.controller;

import br.com.rpmont.conferencia.dtos.SetorRequestDTO;
import br.com.rpmont.conferencia.dtos.SetorResponseDTO;
import br.com.rpmont.conferencia.exception.ForbiddenException;
import br.com.rpmont.conferencia.model.Usuario;
import br.com.rpmont.conferencia.service.SetorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/setores")
@RequiredArgsConstructor
public class SetorController {

    private final SetorService setorService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SetorResponseDTO cadastrar(@Valid @RequestBody SetorRequestDTO request,
                                      Authentication authentication) {

        return setorService.cadastrar(request, obterUsuarioAutenticado(authentication));
    }

    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public List<SetorResponseDTO> listarTodos(Authentication authentication) {
        return setorService.listarTodos(obterUsuarioAutenticado(authentication));
    }

    @GetMapping("/ativos")
    @ResponseStatus(HttpStatus.OK)
    public List<SetorResponseDTO> listarAtivos(Authentication authentication) {
        return setorService.listarAtivos(obterUsuarioAutenticado(authentication));
    }

    @GetMapping("/unidade/{unidadeId}")
    @ResponseStatus(HttpStatus.OK)
    public List<SetorResponseDTO> listarPorUnidade(@PathVariable Long unidadeId,
                                                   Authentication authentication)
    {
        return setorService.listarPorUnidade(unidadeId, obterUsuarioAutenticado(authentication));
    }

    @GetMapping("/unidade/{unidadeId}/ativos")
    @ResponseStatus(HttpStatus.OK)
    public List<SetorResponseDTO> listarAtivosPorUnidade(@PathVariable Long unidadeId,
            Authentication authentication) {
        return setorService.listarAtivosPorUnidade(unidadeId,
                obterUsuarioAutenticado(authentication));
    }

    @GetMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public SetorResponseDTO buscarPorId(@PathVariable Long id, Authentication authentication) {
        return setorService.buscarPorId(id, obterUsuarioAutenticado(authentication));
    }

    @PatchMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public SetorResponseDTO atualizar(@PathVariable Long id, @Valid @RequestBody SetorRequestDTO request,
            Authentication authentication) {
        return setorService.atualizar(id, request, obterUsuarioAutenticado(authentication));
    }

    @PatchMapping("/{id}/inativar")
    @ResponseStatus(HttpStatus.OK)
    public SetorResponseDTO inativar(@PathVariable Long id, Authentication authentication) {
        return setorService.inativar(id, obterUsuarioAutenticado(authentication));
    }

    @PatchMapping("/{id}/reativar")
    @ResponseStatus(HttpStatus.OK)
    public SetorResponseDTO reativar(@PathVariable Long id, Authentication authentication) {
        return setorService.reativar(id, obterUsuarioAutenticado(authentication));
    }

    private Usuario obterUsuarioAutenticado(Authentication authentication) {

        if (authentication == null || authentication.getPrincipal() == null) {
            throw new ForbiddenException("Usuário autenticado não identificado.");
        }
        Object principal = authentication.getPrincipal();

        if (!(principal instanceof Usuario usuario)) {
            throw new ForbiddenException("Usuário autenticado inválido.");
        }

        return usuario;
    }
}