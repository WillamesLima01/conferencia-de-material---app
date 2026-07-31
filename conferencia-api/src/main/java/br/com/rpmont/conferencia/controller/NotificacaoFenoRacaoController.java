package br.com.rpmont.conferencia.controller;

import br.com.rpmont.conferencia.dtos.MarcarNotificacaoLidaResponseDTO;
import br.com.rpmont.conferencia.dtos.NotificacaoFenoRacaoResponseDTO;
import br.com.rpmont.conferencia.exception.ForbiddenException;
import br.com.rpmont.conferencia.model.Usuario;
import br.com.rpmont.conferencia.service.NotificacaoFenoRacaoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/feno-racao/notificacoes")
@RequiredArgsConstructor
public class NotificacaoFenoRacaoController {

    private final NotificacaoFenoRacaoService
            notificacaoService;

    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public ResponseEntity<List<NotificacaoFenoRacaoResponseDTO>>
    listar(
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                notificacaoService.listar(
                        obterMatriculaUsuario(
                                authentication
                        )
                )
        );
    }

    @GetMapping("/nao-lidas")
    @ResponseStatus(HttpStatus.OK)
    public ResponseEntity<List<NotificacaoFenoRacaoResponseDTO>>
    listarNaoLidas(
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                notificacaoService.listarNaoLidas(
                        obterMatriculaUsuario(
                                authentication
                        )
                )
        );
    }

    @GetMapping("/nao-lidas/quantidade")
    @ResponseStatus(HttpStatus.OK)
    public ResponseEntity<Map<String, Long>>
    contarNaoLidas(
            Authentication authentication
    ) {
        long quantidade =
                notificacaoService.contarNaoLidas(
                        obterMatriculaUsuario(
                                authentication
                        )
                );

        return ResponseEntity.ok(
                Map.of(
                        "quantidadeNaoLidas",
                        quantidade
                )
        );
    }

    @PatchMapping("/{notificacaoId}/marcar-lida")
    @ResponseStatus(HttpStatus.OK)
    public ResponseEntity<MarcarNotificacaoLidaResponseDTO>
    marcarComoLida(
            @PathVariable Long notificacaoId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                notificacaoService.marcarComoLida(
                        notificacaoId,
                        obterMatriculaUsuario(
                                authentication
                        )
                )
        );
    }

    private String obterMatriculaUsuario(
            Authentication authentication
    ) {
        if (authentication == null
                || !authentication.isAuthenticated()) {

            throw new ForbiddenException(
                    "Não foi possível identificar o usuário autenticado."
            );
        }

        Object principal =
                authentication.getPrincipal();

        if (principal instanceof Usuario usuario) {
            if (usuario.getMatricula() == null
                    || usuario.getMatricula().isBlank()) {

                throw new ForbiddenException(
                        "O usuário autenticado não possui matrícula."
                );
            }

            return usuario
                    .getMatricula()
                    .trim();
        }

        String matricula =
                authentication.getName();

        if (matricula == null
                || matricula.isBlank()
                || "anonymousUser".equalsIgnoreCase(
                matricula
        )) {
            throw new ForbiddenException(
                    "Não foi possível identificar a matrícula do usuário autenticado."
            );
        }

        return matricula.trim();
    }
}