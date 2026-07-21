package br.com.rpmont.conferencia.controller;

import br.com.rpmont.conferencia.dtos.MovimentacaoMaterialResponseDTO;
import br.com.rpmont.conferencia.service.MovimentacaoMaterialService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/movimentacao-material")
@RequiredArgsConstructor
public class MovimentacaoMaterialController {

    private final MovimentacaoMaterialService movimentacaoMaterialService;

    @GetMapping("/material/{materialId}")
    public ResponseEntity<List<MovimentacaoMaterialResponseDTO>>
    listarHistoricoPorMaterial(
            @PathVariable Long materialId,
            Authentication authentication
    ) {
        String matriculaUsuario =
                authentication.getName();

        List<MovimentacaoMaterialResponseDTO> historico =
                movimentacaoMaterialService
                        .listarHistoricoPorMaterial(
                                materialId,
                                matriculaUsuario
                        );

        return ResponseEntity.ok(
                historico
        );
    }
}