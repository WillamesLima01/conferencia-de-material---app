package br.com.rpmont.conferencia.controller;

import br.com.rpmont.conferencia.dtos.MovimentacaoMaterialFiltroDTO;
import br.com.rpmont.conferencia.dtos.MovimentacaoMaterialResponseDTO;
import br.com.rpmont.conferencia.exception.ForbiddenException;
import br.com.rpmont.conferencia.model.Usuario;
import br.com.rpmont.conferencia.service.MovimentacaoMaterialService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/movimentacao-material")
@RequiredArgsConstructor
public class MovimentacaoMaterialController {

    private final MovimentacaoMaterialService movimentacaoMaterialService;

    /*
     * ==========================================
     * CONSULTA GERAL DE MOVIMENTAÇÕES
     * ==========================================
     */

    @GetMapping
    public ResponseEntity<List<MovimentacaoMaterialResponseDTO>>
    listarMovimentacoes(
            @ModelAttribute MovimentacaoMaterialFiltroDTO filtro,
            Authentication authentication
    ) {
        Long usuarioId = obterUsuarioId(authentication);

        List<MovimentacaoMaterialResponseDTO> movimentacoes =
                movimentacaoMaterialService
                        .listarMovimentacoes(
                                filtro,
                                usuarioId
                        );

        return ResponseEntity.ok(
                movimentacoes
        );
    }

    /*
     * ==========================================
     * HISTÓRICO INDIVIDUAL DO MATERIAL
     * ==========================================
     */

    @GetMapping("/material/{materialId}")
    public ResponseEntity<List<MovimentacaoMaterialResponseDTO>>
    listarHistoricoPorMaterial(
            @PathVariable Long materialId,
            Authentication authentication
    ) {
        Long usuarioId = obterUsuarioId(authentication);

        List<MovimentacaoMaterialResponseDTO> historico =
                movimentacaoMaterialService
                        .listarHistoricoPorMaterial(
                                materialId,
                                usuarioId
                        );

        return ResponseEntity.ok(
                historico
        );
    }

    private Long obterUsuarioId(Authentication authentication) {
        if (authentication != null && authentication.isAuthenticated() &&
                authentication.getPrincipal() instanceof Usuario usuario &&
                usuario.getId() != null) {
            return usuario.getId();
        }

        throw new ForbiddenException("Usuário autenticado não identificado.");
    }
}
