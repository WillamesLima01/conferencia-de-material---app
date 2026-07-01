package br.com.rpmont.conferencia.controller;

import br.com.rpmont.conferencia.dtos.UsuarioRequestDTO;
import br.com.rpmont.conferencia.dtos.UsuarioResponseDTO;
import br.com.rpmont.conferencia.service.UsuarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("usuario")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioService usuarioService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UsuarioResponseDTO salvarUsuario(@RequestBody @Valid UsuarioRequestDTO usuarioRequestDTO) {
        return usuarioService.salvarUsuario(usuarioRequestDTO);
    }

    @GetMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public UsuarioResponseDTO buscarUsuarioPorId(@PathVariable Long id) {
        return usuarioService.buscarUsuarioPorId(id);
    }

    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public List<UsuarioResponseDTO> listarTodosUsuario() {
        return usuarioService.listarTodosUsuario();
    }

    @GetMapping("/matricula/{matricula}")
    @ResponseStatus(HttpStatus.OK)
    public UsuarioResponseDTO buscarUsuarioPorMatricula(@PathVariable String matricula) {
        return usuarioService.buscarUsuarioPorMatricula(matricula);
    }

    @PutMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public UsuarioResponseDTO atualizarUsuarioPorId(@PathVariable Long id,
                                                    @Valid @RequestBody UsuarioRequestDTO usuarioRequestDTO) {
        return usuarioService.atualizarUsuarioPorId(id, usuarioRequestDTO);

    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletarUsuarioId(@PathVariable Long id) {
        usuarioService.deletarUsuarioId(id);
    }

}
