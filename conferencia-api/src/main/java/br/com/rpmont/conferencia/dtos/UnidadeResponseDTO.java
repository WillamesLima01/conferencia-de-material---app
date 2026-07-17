package br.com.rpmont.conferencia.dtos;

import java.time.LocalDateTime;

public record UnidadeResponseDTO(

        Long id,

        String nome,

        String sigla,

        Boolean ativo,

        LocalDateTime dataCadastro,

        LocalDateTime dataModificacao,

        Long usuarioCadastroId,

        String usuarioCadastroNome,

        Long usuarioModificadorId,

        String usuarioModificadorNome

) {
}