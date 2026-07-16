package br.com.rpmont.conferencia.controller;

import br.com.rpmont.conferencia.dtos.MaterialPatrimonialRequestDTO;
import br.com.rpmont.conferencia.dtos.MaterialPatrimonialResponseDTO;
import br.com.rpmont.conferencia.model.Usuario;
import br.com.rpmont.conferencia.service.MaterialPatrimonialService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/material-patrimonial")
@RequiredArgsConstructor
public class MaterialPatrimonialController {

    private final MaterialPatrimonialService materialPatrimonialService;

    /*
     * ==========================================
     * CADASTRAR MATERIAL
     * ==========================================
     */

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MaterialPatrimonialResponseDTO cadastrar(
            @Valid
            @RequestBody
            MaterialPatrimonialRequestDTO request,

            Authentication authentication
    ) {
        return materialPatrimonialService.cadastrar(
                request,
                obterMatriculaUsuario(authentication)
        );
    }

    /*
     * ==========================================
     * LISTAR MATERIAIS
     * ==========================================
     */

    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public List<MaterialPatrimonialResponseDTO> listar(
            Authentication authentication
    ) {
        return materialPatrimonialService.listar(
                obterMatriculaUsuario(authentication)
        );
    }

    /*
     * ==========================================
     * BUSCAR MATERIAL POR ID
     * ==========================================
     */

    @GetMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public MaterialPatrimonialResponseDTO buscarPorId(
            @PathVariable
            Long id,

            Authentication authentication
    ) {
        return materialPatrimonialService.buscarPorId(
                id,
                obterMatriculaUsuario(authentication)
        );
    }

    /*
     * ==========================================
     * BUSCAR POR NÚMERO DE SÉRIE
     * ==========================================
     */

    @GetMapping("/numero-serie/{numeroSerie}")
    @ResponseStatus(HttpStatus.OK)
    public MaterialPatrimonialResponseDTO buscarPorNumeroSerie(
            @PathVariable
            String numeroSerie,

            Authentication authentication
    ) {
        return materialPatrimonialService.buscarPorNumeroSerie(
                numeroSerie,
                obterMatriculaUsuario(authentication)
        );
    }

    /*
     * ==========================================
     * ATUALIZAR MATERIAL
     * ==========================================
     */

    @PatchMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public MaterialPatrimonialResponseDTO atualizar(
            @PathVariable
            Long id,

            @Valid
            @RequestBody
            MaterialPatrimonialRequestDTO request,

            Authentication authentication
    ) {
        return materialPatrimonialService.atualizar(
                id,
                request,
                obterMatriculaUsuario(authentication)
        );
    }

    /*
     * ==========================================
     * CONFERIR MATERIAL
     * ==========================================
     */

    @PatchMapping("/{id}/conferir")
    @ResponseStatus(HttpStatus.OK)
    public MaterialPatrimonialResponseDTO conferir(
            @PathVariable
            Long id,

            Authentication authentication
    ) {
        return materialPatrimonialService.conferir(
                id,
                obterMatriculaUsuario(authentication)
        );
    }

    /*
     * ==========================================
     * INATIVAR MATERIAL
     * ==========================================
     */

    @PatchMapping("/{id}/inativar")
    @ResponseStatus(HttpStatus.OK)
    public MaterialPatrimonialResponseDTO inativar(
            @PathVariable
            Long id,

            Authentication authentication
    ) {
        return materialPatrimonialService.inativar(
                id,
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
        Object principal = authentication.getPrincipal();

        if (principal instanceof Usuario usuario) {
            return usuario.getMatricula();
        }

        throw new IllegalArgumentException(
                "Não foi possível identificar o usuário autenticado."
        );
    }
}