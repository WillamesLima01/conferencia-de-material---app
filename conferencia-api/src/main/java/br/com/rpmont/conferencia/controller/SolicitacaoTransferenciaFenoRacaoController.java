package br.com.rpmont.conferencia.controller;

import br.com.rpmont.conferencia.dtos.AprovarSolicitacaoTransferenciaFenoRacaoRequestDTO;
import br.com.rpmont.conferencia.dtos.SolicitacaoTransferenciaFenoRacaoRequestDTO;
import br.com.rpmont.conferencia.dtos.SolicitacaoTransferenciaFenoRacaoResponseDTO;
import br.com.rpmont.conferencia.enums.StatusSolicitacaoTransferenciaFenoRacao;
import br.com.rpmont.conferencia.model.Usuario;
import br.com.rpmont.conferencia.service.SolicitacaoTransferenciaFenoRacaoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping(
        "/feno-racao/transferencias/solicitacoes"
)
public class SolicitacaoTransferenciaFenoRacaoController {

    private final SolicitacaoTransferenciaFenoRacaoService service;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SolicitacaoTransferenciaFenoRacaoResponseDTO solicitar(
            @Valid
            @RequestBody
            SolicitacaoTransferenciaFenoRacaoRequestDTO request,
            Authentication authentication
    ) {
        return service.solicitar(
                request,
                obterMatriculaUsuario(authentication)
        );
    }

    @GetMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public SolicitacaoTransferenciaFenoRacaoResponseDTO buscarPorId(
            @PathVariable Long id,
            Authentication authentication
    ) {
        return service.buscarPorId(
                id,
                obterMatriculaUsuario(authentication)
        );
    }

    @GetMapping("/recebidas")
    @ResponseStatus(HttpStatus.OK)
    public List<SolicitacaoTransferenciaFenoRacaoResponseDTO>
    listarRecebidas(
            @RequestParam(
                    required = false
            )
            StatusSolicitacaoTransferenciaFenoRacao status,
            Authentication authentication
    ) {
        return service.listarRecebidas(
                status,
                obterMatriculaUsuario(authentication)
        );
    }

    @GetMapping("/enviadas")
    @ResponseStatus(HttpStatus.OK)
    public List<SolicitacaoTransferenciaFenoRacaoResponseDTO>
    listarEnviadas(
            Authentication authentication
    ) {
        return service.listarEnviadas(
                obterMatriculaUsuario(authentication)
        );
    }

    @PatchMapping("/{id}/negar")
    @ResponseStatus(HttpStatus.OK)
    public SolicitacaoTransferenciaFenoRacaoResponseDTO negar(
            @PathVariable Long id,

            @RequestParam
            String observacaoResposta,

            Authentication authentication
    ) {
        return service.negar(
                id,
                observacaoResposta,
                obterMatriculaUsuario(authentication)
        );
    }

    @PatchMapping("/{id}/aprovar")
    @ResponseStatus(HttpStatus.OK)
    public SolicitacaoTransferenciaFenoRacaoResponseDTO aprovar(
            @PathVariable Long id,

            @Valid
            @RequestBody
            AprovarSolicitacaoTransferenciaFenoRacaoRequestDTO request,

            Authentication authentication
    ) {
        return service.aprovar(
                id,
                request,
                obterMatriculaUsuario(authentication)
        );
    }

    private String obterMatriculaUsuario(
            Authentication authentication
    ) {
        if (authentication == null
                || !authentication.isAuthenticated()) {

            return null;
        }

        Object principal =
                authentication.getPrincipal();

        if (principal instanceof Usuario usuario) {
            return usuario.getMatricula();
        }

        return authentication.getName();
    }
}