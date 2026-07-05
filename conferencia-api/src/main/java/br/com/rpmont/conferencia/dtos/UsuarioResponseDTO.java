package br.com.rpmont.conferencia.dtos;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record UsuarioResponseDTO(

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

        Integer ativo,

        LocalDateTime dataSolicitacao,

        LocalDateTime dataLiberacao,

        Long liberadoPor,

        LocalDate dataCadastro,

        LocalDateTime dataModificacao,

        Long userModificador

) {
}