package br.com.rpmont.conferencia.dtos;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UsuarioAdminRequestDTO(

        @NotBlank(message = "A matrícula é obrigatória.")
        String matricula,

        @NotBlank(message = "O nome de guerra é obrigatório.")
        String nome,

        String senha,

        @Email(message = "E-mail inválido.")
        String email,

        Integer nivel,

        String postGrad,

        String setor,

        String nomeCompleto,

        String unidade,

        String statusAcesso

) {
}