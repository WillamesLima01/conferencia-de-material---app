package br.com.rpmont.conferencia.dtos;

import java.time.LocalDateTime;

public record UsuarioResponseDTO(
        Long id,
        String matricula,
        String nome,
        String email,
        Integer nivel,
        String postgrad,
        String setor,
        String nomeCompleto,
        String unidade,
        String statusAcesso,
        Integer ativo,
        LocalDateTime dataSolicitacao,
        LocalDateTime dataLiberacao,
        LocalDateTime dataCadastro,
        LocalDateTime dataModificacao
) {
}
