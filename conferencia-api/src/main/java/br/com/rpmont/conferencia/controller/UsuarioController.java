package br.com.rpmont.conferencia.controller;

import br.com.rpmont.conferencia.dtos.UsuarioAdminRequestDTO;
import br.com.rpmont.conferencia.dtos.UsuarioNivelRequestDTO;
import br.com.rpmont.conferencia.dtos.UsuarioRequestDTO;
import br.com.rpmont.conferencia.dtos.UsuarioResponseDTO;
import br.com.rpmont.conferencia.dtos.UsuarioStatusRequestDTO;
import br.com.rpmont.conferencia.service.UsuarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/usuario")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioService usuarioService;

    @PostMapping("/solicitar-acesso")
    @ResponseStatus(HttpStatus.CREATED)
    public UsuarioResponseDTO solicitarAcesso(
            @RequestBody @Valid UsuarioRequestDTO usuarioRequestDTO
    ) {
        return usuarioService.solicitarAcesso(usuarioRequestDTO);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UsuarioResponseDTO salvarUsuario(
            @RequestBody @Valid UsuarioAdminRequestDTO usuarioAdminRequestDTO
    ) {
        return usuarioService.salvarUsuario(usuarioAdminRequestDTO);
    }

    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public List<UsuarioResponseDTO> listarTodosUsuario() {
        return usuarioService.listarTodosUsuario();
    }

    @GetMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public UsuarioResponseDTO buscarUsuarioPorId(
            @PathVariable Long id
    ) {
        return usuarioService.buscarUsuarioPorId(id);
    }

    @GetMapping("/matricula/{matricula}")
    @ResponseStatus(HttpStatus.OK)
    public UsuarioResponseDTO buscarUsuarioPorMatricula(
            @PathVariable String matricula
    ) {
        return usuarioService.buscarUsuarioPorMatricula(matricula);
    }

    @PutMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public UsuarioResponseDTO atualizarUsuarioPorId(
            @PathVariable Long id,
            @RequestBody @Valid UsuarioAdminRequestDTO usuarioAdminRequestDTO
    ) {
        return usuarioService.atualizarUsuarioPorId(id, usuarioAdminRequestDTO);
    }

    @PatchMapping("/{id}/status")
    @ResponseStatus(HttpStatus.OK)
    public UsuarioResponseDTO alterarStatusUsuario(
            @PathVariable Long id,
            @RequestBody @Valid UsuarioStatusRequestDTO usuarioStatusRequestDTO
    ) {
        return usuarioService.alterarStatusUsuario(id, usuarioStatusRequestDTO);
    }

    @PatchMapping("/{id}/nivel")
    @ResponseStatus(HttpStatus.OK)
    public UsuarioResponseDTO alterarNivelUsuario(
            @PathVariable Long id,
            @RequestBody @Valid UsuarioNivelRequestDTO usuarioNivelRequestDTO
    ) {
        return usuarioService.alterarNivelUsuario(id, usuarioNivelRequestDTO);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletarUsuarioId(
            @PathVariable Long id
    ) {
        usuarioService.deletarUsuarioId(id);
    }
}