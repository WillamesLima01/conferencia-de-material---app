package br.com.rpmont.conferencia.dtos;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record MaterialPatrimonialResponseDTO(

        Long id,

        String numeroSerie,

        String descricao,

        String observacao,

        String setor,

        String unidade,

        LocalDate dataCadastro,

        Integer usuarioCadastroId,

        LocalDateTime dataModificacao,

        Integer usuarioModificadorId,

        Boolean conferido,

        String situacao

) {
}