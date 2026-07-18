package br.com.rpmont.conferencia.dtos;

import java.time.LocalDateTime;

public record SetorResponseDTO(

        Long id,

        String nome,

        Long unidadeId,

        String unidadeNome,

        String unidadeSigla,

        Boolean ativo,

        LocalDateTime dataCadastro,

        LocalDateTime dataModificacao,

        Long usuarioCadastroId,

        String usuarioCadastroNome,

        Long usuarioModificadorId,

        String usuarioModificadorNome
) {
}