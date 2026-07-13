package br.com.rpmont.conferencia.dtos;

public record RedefinirSenhaRequestDTO(

        String email,
        String codigo,
        String novaSenha,
        String confirmarSenha

) {
}
