package br.com.rpmont.conferencia.dtos;

public record LoginResponseDTO(

        String token,
        Long id,
        String matricula,
        String nome,
        String email,
        Integer nivel,
        String postGrad,
        String setor,
        String nomeCompleto,
        String unidade,
        String statusAcesso,
        boolean ativo
) {
}
