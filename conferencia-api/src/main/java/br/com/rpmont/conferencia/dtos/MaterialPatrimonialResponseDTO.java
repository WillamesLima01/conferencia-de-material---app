package br.com.rpmont.conferencia.dtos;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record MaterialPatrimonialResponseDTO(

        Long id,

        String numeroSerie,

        String nome,

        String marca,

        String descricao,

        String observacao,

        String setor,

        String unidade,

        LocalDate dataCadastro,

        Long usuarioId,

        LocalDateTime dataModificacao,

        Long usuarioModificadorId,

        Boolean conferido,

        String situacao

) {
}