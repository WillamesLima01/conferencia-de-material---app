package br.com.rpmont.conferencia.dtos;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UsuarioRequestDTO(

        @NotBlank(message = "A matrícula é obrigatória.")
        String matricula,

        @NotBlank(message = "O nome de guerra é obrigatório.")
        String nome,

        @NotBlank(message = "A senha é obrigatória.")
        @Size(min = 4, message = "A senha deve ter no mínimo 4 caracteres.")
        String senha,

        @Email(message = "E-mail inválido.")
        String email,

        Integer nivel,

        String postGrad,

        String setor,

        String nomeCompleto,

        String unidade,

        String statusAcesso,

        Integer ativo
) {
}
