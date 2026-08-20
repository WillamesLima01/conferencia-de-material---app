package br.com.rpmont.conferencia.controller;

import br.com.rpmont.conferencia.dtos.PendenciasAdministrativasFenoRacaoResponseDTO;
import br.com.rpmont.conferencia.model.Usuario;
import br.com.rpmont.conferencia.service.PendenciasAdministrativasFenoRacaoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/feno-racao/pendencias-administrativas")
@RequiredArgsConstructor
public class PendenciasAdministrativasFenoRacaoController {

    private final PendenciasAdministrativasFenoRacaoService
            pendenciasAdministrativasService;

    /*
     * ==========================================
     * RESUMO DE PENDÊNCIAS ADMINISTRATIVAS
     * ==========================================
     */

    @GetMapping("/resumo")
    @ResponseStatus(HttpStatus.OK)
    public PendenciasAdministrativasFenoRacaoResponseDTO consultarResumo(
            Authentication authentication
    ) {

        return pendenciasAdministrativasService
                .consultarResumo(
                        obterMatriculaUsuario(
                                authentication
                        )
                );
    }

    /*
     * ==========================================
     * AUTENTICAÇÃO
     * ==========================================
     */

    private String obterMatriculaUsuario(
            Authentication authentication
    ) {

        if (
                authentication == null ||
                        !authentication.isAuthenticated()
        ) {
            throw new AuthenticationCredentialsNotFoundException(
                    "Usuário autenticado não identificado."
            );
        }

        Object principal =
                authentication.getPrincipal();

        if (principal instanceof Usuario usuario) {

            String matricula =
                    normalizarTextoOpcional(
                            usuario.getMatricula()
                    );

            if (matricula == null) {
                throw new AuthenticationCredentialsNotFoundException(
                        "A matrícula do usuário autenticado não foi encontrada."
                );
            }

            return matricula;
        }

        String nomeAutenticacao =
                normalizarTextoOpcional(
                        authentication.getName()
                );

        if (nomeAutenticacao == null) {
            throw new AuthenticationCredentialsNotFoundException(
                    "Usuário autenticado não identificado."
            );
        }

        return nomeAutenticacao;
    }

    /*
     * ==========================================
     * NORMALIZAÇÃO
     * ==========================================
     */

    private String normalizarTextoOpcional(
            String valor
    ) {

        if (valor == null) {
            return null;
        }

        String valorNormalizado =
                valor.trim();

        return valorNormalizado.isEmpty()
                ? null
                : valorNormalizado;
    }
}