package br.com.rpmont.conferencia.controller;

import br.com.rpmont.conferencia.dtos.BaixarMaterialRequestDTO;
import br.com.rpmont.conferencia.dtos.DescartarMaterialRequestDTO;
import br.com.rpmont.conferencia.dtos.ExtraviarMaterialRequestDTO;
import br.com.rpmont.conferencia.dtos.MaterialPatrimonialRequestDTO;
import br.com.rpmont.conferencia.dtos.MaterialPatrimonialResponseDTO;
import br.com.rpmont.conferencia.dtos.ReativarMaterialRequestDTO;
import br.com.rpmont.conferencia.dtos.RegistrarFurtoMaterialRequestDTO;
import br.com.rpmont.conferencia.dtos.TransferirConferirMaterialRequestDTO;
import br.com.rpmont.conferencia.model.Usuario;
import br.com.rpmont.conferencia.service.MaterialPatrimonialService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import br.com.rpmont.conferencia.dtos.ZerarConferenciaRequestDTO;

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
     * TRANSFERIR SETOR E CONFERIR
     * ==========================================
     */

    @PatchMapping("/{id}/transferir-e-conferir")
    @ResponseStatus(HttpStatus.OK)
    public MaterialPatrimonialResponseDTO transferirEConferir(
            @PathVariable
            Long id,

            @Valid
            @RequestBody
            TransferirConferirMaterialRequestDTO request,

            Authentication authentication
    ) {
        return materialPatrimonialService.transferirEConferir(
                id,
                request,
                obterMatriculaUsuario(authentication)
        );
    }

    /*
     * ==========================================
     * BAIXAR MATERIAL
     * ==========================================
     */

    @PatchMapping("/{id}/baixar")
    @ResponseStatus(HttpStatus.OK)
    public MaterialPatrimonialResponseDTO baixar(
            @PathVariable
            Long id,

            @Valid
            @RequestBody
            BaixarMaterialRequestDTO request,

            Authentication authentication
    ) {
        return materialPatrimonialService.baixar(
                id,
                request,
                obterMatriculaUsuario(authentication)
        );
    }

    /*
     * ==========================================
     * DESCARTAR MATERIAL
     * ==========================================
     */

    @PatchMapping("/{id}/descartar")
    @ResponseStatus(HttpStatus.OK)
    public MaterialPatrimonialResponseDTO descartar(
            @PathVariable
            Long id,

            @Valid
            @RequestBody
            DescartarMaterialRequestDTO request,

            Authentication authentication
    ) {
        return materialPatrimonialService.descartar(
                id,
                request,
                obterMatriculaUsuario(authentication)
        );
    }

    /*
     * ==========================================
     * REGISTRAR EXTRAVIO
     * ==========================================
     */

    @PatchMapping("/{id}/extraviar")
    @ResponseStatus(HttpStatus.OK)
    public MaterialPatrimonialResponseDTO extraviar(
            @PathVariable
            Long id,

            @Valid
            @RequestBody
            ExtraviarMaterialRequestDTO request,

            Authentication authentication
    ) {
        return materialPatrimonialService.extraviar(
                id,
                request,
                obterMatriculaUsuario(authentication)
        );
    }

    /*
     * ==========================================
     * REGISTRAR FURTO
     * ==========================================
     */

    @PatchMapping("/{id}/registrar-furto")
    @ResponseStatus(HttpStatus.OK)
    public MaterialPatrimonialResponseDTO registrarFurto(
            @PathVariable
            Long id,

            @Valid
            @RequestBody
            RegistrarFurtoMaterialRequestDTO request,

            Authentication authentication
    ) {
        return materialPatrimonialService.registrarFurto(
                id,
                request,
                obterMatriculaUsuario(authentication)
        );
    }

    /*
     * ==========================================
     * REATIVAR MATERIAL
     * ==========================================
     */

    @PatchMapping("/{id}/reativar")
    @ResponseStatus(HttpStatus.OK)
    public MaterialPatrimonialResponseDTO reativar(
            @PathVariable
            Long id,

            @Valid
            @RequestBody
            ReativarMaterialRequestDTO request,

            Authentication authentication
    ) {
        return materialPatrimonialService.reativar(
                id,
                request,
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
     * ZERAR CONFERÊNCIA DA UNIDADE
     * ==========================================
     */

    @PatchMapping("/zerar-conferencia")
    @ResponseStatus(HttpStatus.OK)
    public Integer zerarConferencia(
            @Valid
            @RequestBody
            ZerarConferenciaRequestDTO request,

            Authentication authentication
    ) {
        return materialPatrimonialService.zerarConferencia(
                request,
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
        Object principal =
                authentication.getPrincipal();

        if (principal instanceof Usuario usuario) {
            return usuario.getMatricula();
        }

        throw new IllegalArgumentException(
                "Não foi possível identificar o usuário autenticado."
        );
    }
}