package br.com.rpmont.conferencia.controller;

import br.com.rpmont.conferencia.dtos.TransferenciaFenoRacaoResponseDTO;
import br.com.rpmont.conferencia.enums.SituacaoTransferenciaFenoRacao;
import br.com.rpmont.conferencia.exception.ForbiddenException;
import br.com.rpmont.conferencia.model.Usuario;
import br.com.rpmont.conferencia.service.TransferenciaFenoRacaoService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/feno-racao/transferencias")
@RequiredArgsConstructor
public class TransferenciaFenoRacaoController {

    private final TransferenciaFenoRacaoService
            transferenciaService;

    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public ResponseEntity<List<TransferenciaFenoRacaoResponseDTO>>
    listarTodas(
            @RequestParam(required = false)
            Integer produtoId,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate dataInicial,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate dataFinal,

            @RequestParam(required = false)
            SituacaoTransferenciaFenoRacao situacao,

            Authentication authentication
    ) {
        return ResponseEntity.ok(
                transferenciaService.listarTodas(
                        produtoId,
                        dataInicial,
                        dataFinal,
                        situacao,
                        obterMatriculaUsuario(
                                authentication
                        )
                )
        );
    }

    @GetMapping("/enviadas")
    @ResponseStatus(HttpStatus.OK)
    public ResponseEntity<List<TransferenciaFenoRacaoResponseDTO>>
    listarEnviadas(
            @RequestParam(required = false)
            Integer produtoId,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate dataInicial,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate dataFinal,

            @RequestParam(required = false)
            SituacaoTransferenciaFenoRacao situacao,

            Authentication authentication
    ) {
        return ResponseEntity.ok(
                transferenciaService.listarEnviadas(
                        produtoId,
                        dataInicial,
                        dataFinal,
                        situacao,
                        obterMatriculaUsuario(
                                authentication
                        )
                )
        );
    }

    @GetMapping("/recebidas")
    @ResponseStatus(HttpStatus.OK)
    public ResponseEntity<List<TransferenciaFenoRacaoResponseDTO>>
    listarRecebidas(
            @RequestParam(required = false)
            Integer produtoId,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate dataInicial,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate dataFinal,

            @RequestParam(required = false)
            SituacaoTransferenciaFenoRacao situacao,

            Authentication authentication
    ) {
        return ResponseEntity.ok(
                transferenciaService.listarRecebidas(
                        produtoId,
                        dataInicial,
                        dataFinal,
                        situacao,
                        obterMatriculaUsuario(
                                authentication
                        )
                )
        );
    }

    @GetMapping("/{transferenciaId}")
    @ResponseStatus(HttpStatus.OK)
    public ResponseEntity<TransferenciaFenoRacaoResponseDTO>
    buscarPorId(
            @PathVariable Long transferenciaId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                transferenciaService.buscarPorId(
                        transferenciaId,
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