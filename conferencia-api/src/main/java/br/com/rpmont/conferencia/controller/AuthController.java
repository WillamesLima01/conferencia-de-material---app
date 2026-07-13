package br.com.rpmont.conferencia.controller;

import br.com.rpmont.conferencia.dtos.LoginRequestDTO;
import br.com.rpmont.conferencia.dtos.LoginResponseDTO;
import br.com.rpmont.conferencia.dtos.MensagemResponseDTO;
import br.com.rpmont.conferencia.dtos.RedefinirSenhaRequestDTO;
import br.com.rpmont.conferencia.dtos.SolicitarRecuperacaoSenhaRequestDTO;
import br.com.rpmont.conferencia.dtos.ValidarCodigoRecuperacaoRequestDTO;

import br.com.rpmont.conferencia.service.AuthService;
import br.com.rpmont.conferencia.service.RecuperacaoSenhaService;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RequiredArgsConstructor
@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    private final RecuperacaoSenhaService
            recuperacaoSenhaService;


    /*
     * =====================================================
     * LOGIN
     * =====================================================
     */

    @PostMapping("/login")
    @ResponseStatus(HttpStatus.OK)
    public LoginResponseDTO login(
            @RequestBody
            @Valid
            LoginRequestDTO loginRequestDTO
    ) {

        return authService.login(
                loginRequestDTO
        );
    }


    /*
     * =====================================================
     * SOLICITAR RECUPERAÇÃO DE SENHA
     * =====================================================
     */

    @PostMapping("/recuperar-senha/solicitar")
    @ResponseStatus(HttpStatus.OK)
    public MensagemResponseDTO solicitarRecuperacaoSenha(
            @RequestBody
            SolicitarRecuperacaoSenhaRequestDTO request
    ) {

        recuperacaoSenhaService
                .solicitarRecuperacao(
                        request
                );

        return new MensagemResponseDTO(
                "Se o e-mail informado estiver cadastrado, você receberá as instruções para recuperar sua senha."
        );
    }


    /*
     * =====================================================
     * VALIDAR CÓDIGO DE RECUPERAÇÃO
     * =====================================================
     */

    @PostMapping("/recuperar-senha/validar")
    @ResponseStatus(HttpStatus.OK)
    public MensagemResponseDTO validarCodigoRecuperacao(
            @RequestBody
            ValidarCodigoRecuperacaoRequestDTO request
    ) {

        recuperacaoSenhaService
                .validarCodigo(
                        request
                );

        return new MensagemResponseDTO(
                "Código validado com sucesso."
        );
    }


    /*
     * =====================================================
     * REDEFINIR SENHA
     * =====================================================
     */

    @PostMapping("/recuperar-senha/redefinir")
    @ResponseStatus(HttpStatus.OK)
    public MensagemResponseDTO redefinirSenha(
            @RequestBody
            RedefinirSenhaRequestDTO request
    ) {

        recuperacaoSenhaService
                .redefinirSenha(
                        request
                );

        return new MensagemResponseDTO(
                "Senha redefinida com sucesso."
        );
    }
}